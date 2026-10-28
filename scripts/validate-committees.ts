/**
 * Validate data/committee-catalog.json against the reference markdown files
 * in data/committee-data/ (the "CHECK YOUR WORK" gate from the spec).
 *
 * Usage: npx tsx scripts/validate-committees.ts
 *
 * House reference: data/committee-data/colorado_house_committees_contact.md
 * Senate reference: data/committee-data/colorado_senate_committees.md
 * (colorado_assembly_committee_contacts_2026.md is a redundant superset — not used.)
 *
 * The reference files are the SOURCE OF TRUTH (user decision 2026-10-28).
 * This validator re-parses them with its OWN parser (independent of the
 * fetch script) and asserts the catalog's roster content EXACTLY equals the
 * reference: same committees (matched by name), same members (in order), and
 * per member: name, role, email, phone. District/title are NOT compared (they
 * come from the live site, not the reference). Any mismatch is a HARD ERROR
 * (exit 1) — it means the site would display something that is not the
 * ground truth.
 *
 * Note: because scripts/fetch-committees.ts regenerates the reference from
 * the same in-memory data it writes to the catalog, this gate passes by
 * construction on a fresh run. It is the safety net that catches a hand-edited
 * reference file, a partial catalog write, or a future parser/serializer drift.
 */

import * as fs from "fs";
import * as path from "path";
import type { CommitteeCatalog } from "../src/lib/committee/types";

const ROOT = process.cwd();

interface RefMember {
  name: string;
  role: string | null;
  email: string;
  phone: string;
}
interface RefCommittee {
  name: string;
  members: RefMember[];
}

/** Bounded scan: look at the next `win` non-blank lines for a "label:" value. */
function nextVal(lines: string[], from: number, label: string, win = 4): string {
  let seen = 0;
  for (let j = from + 1; j < lines.length && seen < win; j++) {
    const t = lines[j].trim();
    if (!t) continue;
    seen++;
    const m = t.match(new RegExp(`^${label}:\\s*(.+)$`));
    if (m) return m[1].trim();
  }
  return "";
}

/** Parse a reference md file into committees + members.
 * House: "### <Name>" sections; member = plain "<Name>" (optionally
 *   " - Chair"/" - Vice Chair") line whose NEXT non-blank line is "Email:".
 * Senate: "## <NAME> COMMITTEE" sections; member = "Name: <name>" (optionally
 *   " - Chair"/" - Vice Chair") line.
 * The "next line is Email:" guard skips the trailing "Data Collection Notes"
 * prose (lines like "Email Format Patterns" would otherwise false-match). */
function parseReference(file: string, level: "###" | "##"): RefCommittee[] {
  const lines = fs.readFileSync(file, "utf8").split("\n");
  const committees: RefCommittee[] = [];
  let current: RefCommittee | null = null;
  const plainName = /^[A-Z][a-zA-Z.'-]+( [A-Z][a-zA-Z.'-]+)*$/;

  const isHeading = (line: string) => {
    if (!line.startsWith(level + " ")) return false;
    const t = line.slice(level.length + 1).trim();
    if (/^(House|Senate) Committees of Reference$/.test(t)) return false;
    if (/^(Year-Round|Interim|Other) Committees$/.test(t)) return false;
    if (/^Data Collection Notes$/.test(t)) return false;
    return true;
  };
  const roleOf = (s: string): { bare: string; role: string | null } => {
    const m = s.match(/^(.*?)\s*-\s*(Chair|Vice Chair)$/);
    return m ? { bare: m[1].trim(), role: m[2] } : { bare: s, role: null };
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (isHeading(line)) {
      current = { name: line.slice(level.length + 1).trim().replace(/\s+COMMITTEE$/, ""), members: [] };
      committees.push(current);
      continue;
    }
    if (!current) continue;

    const nameM = line.match(/^Name:\s*(.+)$/);
    if (nameM) {
      const { bare, role } = roleOf(nameM[1].trim());
      current.members.push({ name: bare, role, email: nextVal(lines, i, "Email"), phone: nextVal(lines, i, "Phone") });
      continue;
    }
    const { bare, role } = roleOf(line);
    if (
      plainName.test(bare) &&
      bare.length > 3 &&
      !/^(Email|Phone|Name|This|Senate|House|Proper|Methodology|Phone Pattern|Email Format)/.test(bare)
    ) {
      const email = nextVal(lines, i, "Email");
      if (email) {
        current.members.push({ name: bare, role, email, phone: nextVal(lines, i, "Phone") });
      }
    }
  }
  return committees;
}

function norm(s: string): string {
  return s.toLowerCase().replace(/&/g, "and").replace(/\s+/g, " ").trim();
}

async function main() {
  const catalog: CommitteeCatalog = JSON.parse(
    fs.readFileSync(path.join(ROOT, "data/committee-catalog.json"), "utf8")
  );
  const houseRef = parseReference(
    path.join(ROOT, "data/committee-data/colorado_house_committees_contact.md"),
    "###"
  );
  const senateRef = parseReference(
    path.join(ROOT, "data/committee-data/colorado_senate_committees.md"),
    "##"
  );

  let errors = 0;
  const fail = (msg: string) => {
    errors++;
    console.error(`  ERROR: ${msg}`);
  };

  function checkChamber(chamber: "house" | "senate", ref: RefCommittee[]) {
    const live = catalog.committees.filter((c) => c.chamber === chamber);
    console.log(`\n${chamber.toUpperCase()}: ${live.length} catalog committees vs ${ref.length} reference committees`);
    if (live.length !== ref.length) {
      fail(`${chamber}: committee count ${live.length} (catalog) vs ${ref.length} (reference)`);
    }
    const refByName = new Map(ref.map((c) => [norm(c.name), c]));
    for (const c of live) {
      const keyA = norm(c.name);
      const keyB = norm(c.name.replace(/&/g, "and"));
      const r = refByName.get(keyA) ?? refByName.get(keyB);
      if (!r) {
        fail(`${c.name}: catalog committee not found in reference file`);
        continue;
      }
      refByName.delete(keyA);
      refByName.delete(keyB);

      if (c.members.length !== r.members.length) {
        fail(`${c.name}: member count ${c.members.length} (catalog) vs ${r.members.length} (reference)`);
      }
      const n = Math.min(c.members.length, r.members.length);
      for (let j = 0; j < n; j++) {
        const cm = c.members[j];
        const rm = r.members[j];
        if (norm(cm.name) !== norm(rm.name)) {
          fail(`${c.name}[${j}]: name "${cm.name}" (catalog) vs "${rm.name}" (reference)`);
        }
        if ((cm.role ?? null) !== (rm.role ?? null)) {
          fail(`${c.name}[${j}] ${cm.name}: role ${JSON.stringify(cm.role)} (catalog) vs ${JSON.stringify(rm.role)} (reference)`);
        }
        if (norm(cm.email) !== norm(rm.email)) {
          fail(`${c.name}[${j}] ${cm.name}: email ${cm.email} (catalog) vs ${rm.email} (reference)`);
        }
        if (norm(cm.phone) !== norm(rm.phone)) {
          fail(`${c.name}[${j}] ${cm.name}: phone ${cm.phone} (catalog) vs ${rm.phone} (reference)`);
        }
      }
    }
    for (const [name, rc] of refByName) {
      fail(`reference committee "${name}" (${rc.members.length} members) has no catalog counterpart`);
    }
  }

  checkChamber("house", houseRef);
  checkChamber("senate", senateRef);

  console.log(`\nValidation: ${errors} error(s)`);
  if (errors > 0) process.exit(1);
  console.log("OK — catalog roster content matches the reference (source of truth).");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

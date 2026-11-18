/**
 * Fetch the County Sheriffs of Colorado directory (OCV static JSON) and
 * regenerate data/chp/sheriffs.json.
 *
 * Usage: npx tsx scripts/fetch-chp-sheriffs.ts
 *
 * www.coloradosheriffs.org is a React SPA; the directory data is a
 * public static JSON on the OCV CDN. County names are normalized to
 * UPPERCASE to match data/districts/districts.json (64 = 64, verified).
 * Hand-researched fields (chpEmail, website, chpUrl, hours) are carried
 * forward from the previous file by county name.
 */
import * as fs from "fs";
import * as path from "path";
import type { SheriffsData, SheriffInfo } from "../src/lib/chp/types";
import { stampFreshness } from "../src/lib/data/data-stamp";
import { recordCheck } from "../src/lib/data/check-record";

const ROOT = process.cwd();
const DATA_FILE = path.join(ROOT, "data/chp/sheriffs.json");
const OCV_URL = "https://cdn.myocv.com/ocvapps/a132480125/public/contact_sheriffSDirectory.json";

interface OcvEntry { title: string; jobtitle: string; phone: string; fax?: string; address: string; }

/** "Adams County" -> "ADAMS"; "Broomfield Police Dep." -> "BROOMFIELD". */
function countyKey(title: string): string {
  return title.replace(/\s*(County|Police Dep\.)$/, "").trim().toUpperCase();
}

async function main() {
  const res = await fetch(OCV_URL, { headers: { "User-Agent": "armed-colorado-fetch/1.0" } });
  if (!res.ok) {
    console.error(`OCV fetch failed: HTTP ${res.status}`);
    process.exit(1);
  }
  const raw = (await res.json()) as { entries: { Counties: OcvEntry[] } };
  const entries = raw.entries.Counties;
  if (entries.length !== 64) {
    console.error(`Expected 64 county entries, got ${entries.length}. OCV structure may have changed — inspect and update this script.`);
    process.exit(1);
  }

  const prevData: SheriffsData | null = fs.existsSync(DATA_FILE)
    ? (JSON.parse(fs.readFileSync(DATA_FILE, "utf8")) as SheriffsData)
    : null;
  const prev = new Map((prevData?.sheriffs ?? []).map((s) => [s.county, s]));

  const sheriffs: SheriffInfo[] = entries.map((e) => {
    const county = countyKey(e.title);
    const kept = prev.get(county);
    return {
      county,
      sheriff: e.jobtitle,
      phone: e.phone,
      fax: e.fax ?? null,
      address: e.address,
      chpEmail: kept?.chpEmail ?? null,
      website: kept?.website ?? null,
      chpUrl: kept?.chpUrl ?? null,
      hours: kept?.hours ?? null,
    };
  });

  // Diff summary — names the affected page section.
  if (prev.size > 0) {
    const changed: string[] = [];
    for (const s of sheriffs) {
      const p = prev.get(s.county);
      if (!p) continue;
      if (p.sheriff !== s.sheriff) changed.push(`${s.county}: sheriff ${p.sheriff} → ${s.sheriff}`);
      else if (p.phone !== s.phone) changed.push(`${s.county}: phone ${p.phone} → ${s.phone}`);
    }
    console.log("Sheriff map section diff:");
    console.log(`  changed: ${changed.join("; ") || "—"}`);
  } else {
    console.log("First run — no previous data to diff.");
  }

  const data: SheriffsData = {
    fetchedAt: new Date().toISOString(),
    sourceUrl: OCV_URL,
    sheriffs,
  };
  // Freshness stamps + no-op discipline (user rule: no no-op commits):
  // same content (incl. carried-forward hand-researched fields) → write
  // NOTHING. A sheriff/phone change → write + commit-ready.
  const stamps = stampFreshness(prevData, data);
  if (!stamps.changed) {
    recordCheck(["data/chp/sheriffs.json"], "up-to-date");
    console.log("UP-TO-DATE: sheriff directory unchanged — no file written, nothing to commit.");
    return;
  }
  Object.assign(data, stamps);
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2) + "\n", "utf8");
  recordCheck(["data/chp/sheriffs.json"], "updated");
  console.log(`Wrote ${sheriffs.length} sheriffs to data/chp/sheriffs.json`);
}

main().catch((e) => { console.error(e); process.exit(1); });

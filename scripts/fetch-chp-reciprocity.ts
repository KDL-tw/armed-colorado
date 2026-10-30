/**
 * Fetch the CBI CHP reciprocity page and regenerate data/chp/reciprocity.json.
 *
 * Usage: npx tsx scripts/fetch-chp-reciprocity.ts
 *
 * CBI publishes exactly two lists: states where reciprocity HAS been
 * established (status "full") and states where it has NOT (status
 * "none"). Colorado is always "full" with itself (self-recognition).
 * A "partial" (yellow) state can only be added by hand with a `note`
 * describing the discrepancy — CBI has no such category today.
 *
 * Prints a diff summary (added/removed/moved states) naming the affected
 * page section. Exit 1 if either list fails to parse or is empty.
 */
import * as fs from "fs";
import * as path from "path";
import type { ReciprocityData, ReciprocityState } from "../src/lib/chp/types";

const ROOT = process.cwd();
const DATA_FILE = path.join(ROOT, "data/chp/reciprocity.json");
const CBI_URL = "https://cbi.colorado.gov/sections/firearms-instacheck-unit/concealed-handgun-permit-chp-reciprocity";
// CBI is behind CloudFront: a bare curl UA gets 403. Use a full browser UA.
const UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";

const REQUIREMENTS = [
  "The issuing state recognizes/honors a Colorado permit (CHP).",
  "The permit holder is a resident of the issuing state.",
  "The permit holder is in possession of a matching state-issued driver's license or state ID showing residency in that state.",
  "The permit holder is 21 years of age or older.",
  "The permit holder is in possession of a valid permit.",
  "Colorado does not recognize a permit issued to a nonresident of the issuing state — state of residency and state of issue must match (C.R.S. 18-12-213, as amended 2007).",
  "A Colorado resident may carry concealed in-state only with a Colorado CHP — never with another state's permit.",
];

/** First <p><strong>…</strong></p> after `marker`; split on commas / " and ". */
function listAfter(html: string, marker: string): string[] {
  const i = html.indexOf(marker);
  if (i < 0) return [];
  const seg = html.slice(i, i + 2000);
  const m = seg.match(/<p>\s*<strong>([\s\S]*?)<\/strong>/);
  if (!m) return [];
  return m[1]
    .replace(/\s+/g, " ")
    .replace(/ and /g, ",")
    .split(",")
    .map((s) => s.replace(/\.$/, "").trim())
    .filter(Boolean);
}

async function main() {
  const res = await fetch(CBI_URL, { headers: { "User-Agent": UA, Accept: "text/html" } });
  if (!res.ok) {
    console.error(`CBI fetch failed: HTTP ${res.status}`);
    process.exit(1);
  }
  const html = await res.text();

  const full = listAfter(html, "has been</u> established");
  const none = listAfter(html, "has not been");
  if (full.length === 0 || none.length === 0) {
    console.error(`Parse failed: full=${full.length} none=${none.length}. CBI page structure may have changed — inspect the page and update the markers.`);
    process.exit(1);
  }

  const prev: ReciprocityData | null = fs.existsSync(DATA_FILE)
    ? (JSON.parse(fs.readFileSync(DATA_FILE, "utf8")) as ReciprocityData)
    : null;
  const prevByName = new Map(prev?.states.map((s) => [s.name, s.status]) ?? []);

  const states: ReciprocityState[] = [
    { name: "Colorado", status: "full" },
    ...full.map((name) => ({ name, status: "full" as const })),
    ...none.map((name) => ({ name, status: "none" as const })),
  ];

  // Diff summary — names the affected page section.
  if (prev) {
    const added: string[] = [];
    const removed: string[] = [];
    const moved: string[] = [];
    const nextByName = new Map(states.map((s) => [s.name, s.status]));
    for (const s of states) if (!prevByName.has(s.name)) added.push(s.name);
    for (const s of prev.states) if (!nextByName.has(s.name)) removed.push(s.name);
    for (const s of states) {
      const old = prevByName.get(s.name);
      if (old && old !== s.status) moved.push(`${s.name}: ${old} → ${s.status}`);
    }
    console.log("Reciprocity map section diff:");
    console.log(`  added:   ${added.join(", ") || "—"}`);
    console.log(`  removed: ${removed.join(", ") || "—"}`);
    console.log(`  moved:   ${moved.join(", ") || "—"}`);
  } else {
    console.log("First run — no previous data to diff.");
  }

  const data: ReciprocityData = {
    fetchedAt: new Date().toISOString(),
    sourceUrl: CBI_URL,
    statuteCitation: "18-12-213",
    requirements: REQUIREMENTS,
    states,
  };
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2) + "\n", "utf8");
  console.log(`Wrote ${states.length} states (${full.length} full + Colorado, ${none.length} none) to data/chp/reciprocity.json`);
}

main().catch((e) => { console.error(e); process.exit(1); });

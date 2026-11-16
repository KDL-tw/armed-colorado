/**
 * Sanity-check data/sb25/ssf.json before shipping. Run:
 * `npx tsx scripts/validate-sb25-ssf.ts`. Exits non-zero on a hard failure so a
 * bad list can't ship silently.
 */
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import type { SsfData } from "../src/lib/sb25/types";

const file = path.join(process.cwd(), "data", "sb25", "ssf.json");
if (!existsSync(file)) {
  console.error("MISSING data/sb25/ssf.json — run `npx tsx scripts/fetch-sb25-ssf.ts`");
  process.exit(1);
}
const data = JSON.parse(readFileSync(file, "utf8")) as SsfData;
const errors: string[] = [];
const { counts, firearms } = data;

// counts must be consistent with the array
const recount = { rifle: 0, shotgun: 0, handgun: 0 };
for (const f of firearms) recount[f.category]++;
if (recount.rifle !== counts.rifle) errors.push(`rifle count mismatch: ${counts.rifle} vs ${recount.rifle}`);
if (recount.shotgun !== counts.shotgun) errors.push(`shotgun count mismatch: ${counts.shotgun} vs ${recount.shotgun}`);
if (recount.handgun !== counts.handgun) errors.push(`handgun count mismatch: ${counts.handgun} vs ${recount.handgun}`);
if (counts.total !== firearms.length) errors.push(`total mismatch: ${counts.total} vs ${firearms.length}`);

// sanity floor — the real list has ~876 entries; a bad parse yields far fewer.
if (firearms.length < 100) errors.push(`only ${firearms.length} firearms — parse likely failed`);

// no leaked noise (page numbers, footer lines, known notes, garbage)
const bad = firearms.filter(
  (f) =>
    /^\d+$/.test(f.name) ||                              // bare page number
    /photographs are examples only/i.test(f.name) ||     // footer line 1
    /^(in )?the series\.?$/i.test(f.name) ||             // footer line 2 (both wrap variants)
    /semiautomatic models only/i.test(f.name) ||         // known PDF note
    f.name.trim().length < 4                             // garbage
);
if (bad.length) errors.push(`leaked noise entries: ${bad.map((f) => f.name).slice(0, 5).join(" | ")}`);

// prose guard: a sentence (>= 4 all-lowercase words) never belongs in the list
const prose = firearms.filter((f) => {
  const w = f.name.split(/[^\p{L}]+/u).filter((x) => x.length >= 3 && x === x.toLowerCase());
  return w.length >= 4;
});
if (prose.length) errors.push(`leaked prose entries: ${prose.map((f) => f.name).slice(0, 3).join(" | ")}`);

if (errors.length) {
  console.error("VALIDATION FAILED:");
  for (const e of errors) console.error("  - " + e);
  process.exit(1);
}
console.log(`VALIDATION OK: ${counts.total} firearms (r=${counts.rifle} s=${counts.shotgun} h=${counts.handgun}) — ${data.version}`);

/**
 * Verify data/chp/crs.json against the live CBI CHP page.
 *
 * Usage: npx tsx scripts/fetch-chp-crs.ts
 *
 * Compares (a) the set of CRS/federal citations and (b) the three fee
 * totals on the CBI page against the committed data. If either changed,
 * exit 1 with a diff — the research content (titles/summaries) must be
 * re-verified by a human against the new statute text before merging.
 * On success, updates `fetchedAt` and prints OK.
 */
import * as fs from "fs";
import * as path from "path";
import type { CrsData } from "../src/lib/chp/types";

const ROOT = process.cwd();
const DATA_FILE = path.join(ROOT, "data/chp/crs.json");
const CBI_URL = "https://cbi.colorado.gov/firearms/concealed-handgun-permit-chp";
// CBI is behind CloudFront: a bare curl UA gets 403. Use a full browser UA.
const UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";

/** CBI lists statutes as "C.R.S. 18-12-201 (…)" and "18 USC 926A, (…)". */
const CRS_RE = /C\.R\.S\.\s*([\d.]+(?:-[\d.]+)+)/g;
const USC_RE = /18\s+USC\s+(926[A-C])/g;
const FEE_RE = /\$(\d+\.\d{2})/g;

async function main() {
  const res = await fetch(CBI_URL, { headers: { "User-Agent": UA, Accept: "text/html" } });
  if (!res.ok) {
    console.error(`CBI fetch failed: HTTP ${res.status}`);
    process.exit(1);
  }
  const html = await res.text();

  const liveCrs = new Set<string>();
  for (const m of html.matchAll(CRS_RE)) liveCrs.add(m[1]);
  const liveUs = new Set<string>();
  for (const m of html.matchAll(USC_RE)) liveUs.add(`18 USC ${m[1]}`);

  const data: CrsData = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  // `related` statutes (18-12-106, 18-1-704) govern the page's topics but are
  // NOT in the CBI CHP statute list — exclude them from the CBI reconciliation.
  const dataCrs = new Set(data.statutes.filter((s) => !s.federal && !s.related).map((s) => s.citation));
  const dataUs = new Set(data.statutes.filter((s) => s.federal && !s.related).map((s) => s.citation));

  let errors = 0;
  const fail = (msg: string) => { errors++; console.error(`  ERROR: ${msg}`); };

  for (const c of liveCrs) if (!dataCrs.has(c)) fail(`CBI lists CRS ${c} — not in data/chp/crs.json`);
  for (const c of dataCrs) if (!liveCrs.has(c)) fail(`data lists CRS ${c} — no longer on CBI page`);
  for (const c of liveUs) if (!dataUs.has(c)) fail(`CBI lists ${c} — not in data/chp/crs.json`);
  for (const c of dataUs) if (!liveUs.has(c)) fail(`data lists ${c} — no longer on CBI page`);

  // Fee totals: the three bold totals on the page are 52.50 / 30.50 / 13.00.
  const liveFees = new Set<string>();
  for (const m of html.matchAll(FEE_RE)) liveFees.add(m[1]);
  const expectFees: [string, number][] = [
    ["newApplication", data.fees.newApplication.total],
    ["temporaryEmergency", data.fees.temporaryEmergency.total],
    ["renewal", data.fees.renewal.total],
  ];
  for (const [name, total] of expectFees) {
    if (!liveFees.has(total.toFixed(2))) fail(`fee ${name} = $${total.toFixed(2)} not found on CBI page (fee changed?)`);
  }

  if (errors > 0) {
    console.error(`\nfetch-chp-crs: ${errors} error(s). Re-verify the affected statutes against the new text, update data/chp/crs.json, then re-run.`);
    process.exit(1);
  }
  data.fetchedAt = new Date().toISOString();
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2) + "\n", "utf8");
  console.log(`OK — statute list (${liveCrs.size} CRS + ${liveUs.size} federal) and fee totals match the CBI page. fetchedAt updated.`);
}

main().catch((e) => { console.error(e); process.exit(1); });

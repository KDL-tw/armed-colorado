/**
 * Validate data/chp/sheriffs.json.
 *
 * Usage: npx tsx scripts/validate-chp-sheriffs.ts
 *
 * Asserts: 64 sheriffs, every `county` name exists in
 * data/districts/districts.json counties (the map join key), no
 * duplicates, sheriff + phone present and non-empty, address present.
 * Exit 1 on any violation.
 */
import * as fs from "fs";
import * as path from "path";
import type { SheriffsData } from "../src/lib/chp/types";

const ROOT = process.cwd();
const DATA_FILE = path.join(ROOT, "data/chp/sheriffs.json");
const DISTRICTS_FILE = path.join(ROOT, "data/districts/districts.json");

async function main() {
  const data: SheriffsData = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  const districts = JSON.parse(fs.readFileSync(DISTRICTS_FILE, "utf8")) as { counties: { name: string }[] };
  const countyNames = new Set(districts.counties.map((c) => c.name));

  let errors = 0;
  const fail = (msg: string) => { errors++; console.error(`  ERROR: ${msg}`); };

  if (data.sheriffs.length !== 64) fail(`expected 64 sheriffs, got ${data.sheriffs.length}`);
  const seen = new Set<string>();
  for (const s of data.sheriffs) {
    if (seen.has(s.county)) fail(`duplicate county: ${s.county}`);
    seen.add(s.county);
    if (!countyNames.has(s.county)) fail(`county "${s.county}" not in districts.json (map will not render it)`);
    if (!s.sheriff?.trim()) fail(`${s.county}: missing sheriff name`);
    if (!s.phone?.trim()) fail(`${s.county}: missing phone`);
    if (!s.address?.trim()) fail(`${s.county}: missing address`);
  }
  const missing = [...countyNames].filter((n) => !seen.has(n));
  if (missing.length) fail(`counties in districts.json with no sheriff entry: ${missing.join(", ")}`);
  console.log(`sheriffs.json: ${data.sheriffs.length} entries, all matched to county geometry`);
  if (errors > 0) process.exit(1);
  console.log("OK — sheriffs.json is valid.");
}

main().catch((e) => { console.error(e); process.exit(1); });

/**
 * Validate data/chp/reciprocity.json.
 *
 * Usage: npx tsx scripts/validate-chp-reciprocity.ts
 *
 * Asserts: 51 states total (50 + DC), Colorado present and "full", no
 * duplicate names, every name matches a US state/DC name (so the map
 * can color it), and every "partial" entry has a `note`. Exit 1 on any
 * violation.
 */
import * as fs from "fs";
import * as path from "path";
import type { ReciprocityData } from "../src/lib/chp/types";

const ROOT = process.cwd();
const DATA_FILE = path.join(ROOT, "data/chp/reciprocity.json");

const US_STATES_AND_DC = new Set([
  "Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut","Delaware",
  "District of Columbia","Florida","Georgia","Hawaii","Idaho","Illinois","Indiana","Iowa",
  "Kansas","Kentucky","Louisiana","Maine","Maryland","Massachusetts","Michigan","Minnesota",
  "Mississippi","Missouri","Montana","Nebraska","Nevada","New Hampshire","New Jersey",
  "New Mexico","New York","North Carolina","North Dakota","Ohio","Oklahoma","Oregon",
  "Pennsylvania","Rhode Island","South Carolina","South Dakota","Tennessee","Texas",
  "Utah","Vermont","Virginia","Washington","West Virginia","Wisconsin","Wyoming",
]);

async function main() {
  const data: ReciprocityData = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  let errors = 0;
  const fail = (msg: string) => { errors++; console.error(`  ERROR: ${msg}`); };

  if (data.states.length !== 51) fail(`expected 51 states (50 + DC), got ${data.states.length}`);
  const seen = new Set<string>();
  for (const s of data.states) {
    if (seen.has(s.name)) fail(`duplicate state: ${s.name}`);
    seen.add(s.name);
    if (!US_STATES_AND_DC.has(s.name)) fail(`unknown state name (map cannot color it): ${s.name}`);
    if (s.status === "partial" && !s.note) fail(`partial state ${s.name} missing note`);
  }
  const co = data.states.find((s) => s.name === "Colorado");
  if (!co || co.status !== "full") fail("Colorado must be present with status 'full'");
  const full = data.states.filter((s) => s.status === "full" && s.name !== "Colorado").length;
  const none = data.states.filter((s) => s.status === "none").length;
  console.log(`reciprocity.json: ${data.states.length} states — ${full} full (excl. CO), ${none} none, ${data.states.length - full - none} other`);
  if (errors > 0) process.exit(1);
  console.log("OK — reciprocity.json is valid.");
}

main().catch((e) => { console.error(e); process.exit(1); });

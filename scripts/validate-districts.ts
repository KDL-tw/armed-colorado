/**
 * CI guard for data/districts: structure, counts, hash consistency, size.
 * Mirrors scripts/validate-committees.ts. Exits non-zero on any violation.
 */
import { createHash } from "node:crypto";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
// Relative import — scripts/ convention (see scripts/assemble-catalog.ts).
import type { DistrictsData, DistrictsManifest } from "../src/lib/districts/types";

const DATA_DIR = path.join(process.cwd(), "data", "districts");
const errors: string[] = [];
const fail = (msg: string) => errors.push(msg);

const dataPath = path.join(DATA_DIR, "districts.json");
const manifestPath = path.join(DATA_DIR, "manifest.json");
if (!existsSync(dataPath)) fail("missing data/districts/districts.json — run `npm run fetch-districts`");
if (!existsSync(manifestPath)) fail("missing data/districts/manifest.json — run `npm run fetch-districts`");
if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

const raw = readFileSync(dataPath, "utf8");
const data = JSON.parse(raw) as DistrictsData;
const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as DistrictsManifest;

// Hash + size consistency.
if (createHash("sha256").update(raw).digest("hex") !== manifest.sha256) {
  fail("manifest sha256 does not match districts.json — re-run `npm run fetch-districts`");
}
const sizeMb = Buffer.byteLength(raw) / (1024 * 1024);
if (sizeMb > 1.2) fail(`districts.json is ${sizeMb.toFixed(2)} MB (> 1.2 MB budget)`);

// Structure.
const checkChamber = (key: "house" | "senate", expected: number) => {
  const ch = data[key];
  if (!ch?.districts) return fail(`${key}: missing districts array`);
  if (ch.districts.length !== expected) fail(`${key}: expected ${expected} districts, got ${ch.districts.length}`);
  const seen = new Set<number>();
  for (const d of ch.districts) {
    if (!Number.isInteger(d.district) || d.district < 1 || d.district > expected) {
      fail(`${key}: bad district number ${d.district}`);
    }
    seen.add(d.district);
    if (!Array.isArray(d.rings) || d.rings.length === 0) fail(`${key} district ${d.district}: empty rings`);
    if (!Array.isArray(d.label) || d.label.length !== 2) fail(`${key} district ${d.district}: bad label`);
    for (const poly of d.rings) {
      for (const ring of poly) {
        if (ring.length < 4) fail(`${key} district ${d.district}: ring with < 4 points`);
        if (ring[0][0] !== ring[ring.length - 1][0] || ring[0][1] !== ring[ring.length - 1][1]) {
          fail(`${key} district ${d.district}: ring not closed`);
        }
      }
    }
  }
  for (let i = 1; i <= expected; i++) if (!seen.has(i)) fail(`${key}: missing district ${i}`);
};
checkChamber("house", 65);
checkChamber("senate", 35);
if (data.counties.length !== 64) fail(`expected 64 counties, got ${data.counties.length}`);
if (manifest.planYear !== data.planYear) fail("manifest planYear != data planYear");

if (errors.length) {
  console.error(`validate-districts: ${errors.length} error(s):\n` + errors.join("\n"));
  process.exit(1);
}
console.log("validate-districts: OK");

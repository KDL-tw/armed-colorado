/**
 * Convert the user-provided Google Sheet CSV export (data/sb25/instructors-src.csv)
 * into data/sb25/instructors.json. The Google sheet itself is not fetchable by the
 * agent (owner policy blocks Google); the user exports it to CSV.
 *
 * Run: `npx tsx scripts/fetch-sb25-instructors.ts`.
 * When instructors-src.csv is absent, write a 0-row file so the page degrades to a
 * "directory coming soon" note (the section is optional, not blocking).
 */
import { readFileSync, existsSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { parseInstructorsCsv } from "../src/lib/sb25/instructor-parser";
import type { Sb25Instructors } from "../src/lib/sb25/types";
import { stampFreshness } from "../src/lib/data/data-stamp";

const SRC = path.join(process.cwd(), "data", "sb25", "instructors-src.csv");
const OUT = path.join(process.cwd(), "data", "sb25", "instructors.json");
mkdirSync(path.dirname(OUT), { recursive: true });

// Previous file (for freshness change detection).
let prev: unknown = null;
try {
  prev = JSON.parse(readFileSync(OUT, "utf8"));
} catch {
  /* first run — no previous file */
}

if (!existsSync(SRC)) {
  console.error(
    "data/sb25/instructors-src.csv not found — writing an empty instructors.json (page shows a 'coming soon' note).",
  );
  const empty: Sb25Instructors = {
    fetchedAt: new Date().toISOString(),
    source: "none (no CSV provided yet)",
    instructors: [],
  };
  Object.assign(empty, stampFreshness(prev, empty));
  writeFileSync(OUT, JSON.stringify(empty, null, 2) + "\n");
  process.exit(0);
}

const csv = readFileSync(SRC, "utf8");
const data = parseInstructorsCsv(csv, "data/sb25/instructors-src.csv");
// Freshness stamps: fetchedAt on every run; updatedAt only if the roster
// content actually changed vs. the previous file.
Object.assign(data, stampFreshness(prev, data));
writeFileSync(OUT, JSON.stringify(data, null, 2) + "\n");
console.error(`wrote ${data.instructors.length} instructors to data/sb25/instructors.json`);

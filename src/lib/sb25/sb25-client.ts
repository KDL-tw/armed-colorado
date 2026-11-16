import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import type { Sb25Process, SsfData, Sb25Instructors } from "./types";

/**
 * Read the committed SB25-003 page data. Server-side only (the /sb25-003 page
 * is a server component). Path is portable via process.cwd(). Deliberately
 * throws (rather than returning a fallback) when a file is missing — an empty
 * page would render silently broken, whereas a loud build failure tells the
 * developer to run the fetch script (same contract as chp-client.ts).
 */
function loadJson<T>(rel: string, hint: string): T {
  const file = path.join(process.cwd(), rel);
  if (!existsSync(file)) {
    throw new Error(`Missing ${rel} — ${hint}`);
  }
  return JSON.parse(readFileSync(file, "utf8")) as T;
}

export const loadSb25Process = () =>
  loadJson<Sb25Process>("data/sb25/process.json", "author data/sb25/process.json by hand (see plan Task 5)");
export const loadSb25Ssf = () =>
  loadJson<SsfData>("data/sb25/ssf.json", "run `npx tsx scripts/fetch-sb25-ssf.ts`");
export const loadSb25Instructors = () =>
  loadJson<Sb25Instructors>("data/sb25/instructors.json", "run `npx tsx scripts/fetch-sb25-instructors.ts` (needs data/sb25/instructors-src.csv)");

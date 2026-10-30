import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import type { CrsData, ReciprocityData, SheriffsData } from "./types";

/**
 * Read the committed CHP page data. Server-side only (the
 * /concealed-carry page is a server component). Path is portable via
 * process.cwd(). Deliberately throws (rather than returning a fallback)
 * when a file is missing — an empty page would render silently broken,
 * whereas a loud build failure tells the developer to run the fetch
 * script (same contract as src/lib/districts/districts-client.ts).
 */
function loadJson<T>(rel: string, script: string): T {
  const file = path.join(process.cwd(), rel);
  if (!existsSync(file)) {
    throw new Error(`Missing ${rel} — run \`${script}\``);
  }
  return JSON.parse(readFileSync(file, "utf8")) as T;
}

export function loadCrsData(): CrsData {
  return loadJson<CrsData>("data/chp/crs.json", "npm run fetch-chp-crs");
}
export function loadReciprocityData(): ReciprocityData {
  return loadJson<ReciprocityData>("data/chp/reciprocity.json", "npm run fetch-chp-reciprocity");
}
export function loadSheriffsData(): SheriffsData {
  return loadJson<SheriffsData>("data/chp/sheriffs.json", "npm run fetch-chp-sheriffs");
}

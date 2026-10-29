import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import type { DistrictsData } from "./types";

/**
 * Read the committed district map data. Server-side only (the /legislators
 * page is a server component). Path is portable via process.cwd().
 *
 * Deliberately throws (rather than returning a fallback) when the file is
 * missing: an empty map would render as a silently-broken page, whereas a
 * loud build failure tells the developer to run `npm run fetch-districts`.
 */
export function loadDistrictsData(): DistrictsData {
  const file = path.join(process.cwd(), "data", "districts", "districts.json");
  if (!existsSync(file)) {
    throw new Error(`Missing ${file} — run \`npm run fetch-districts\``);
  }
  return JSON.parse(readFileSync(file, "utf8")) as DistrictsData;
}

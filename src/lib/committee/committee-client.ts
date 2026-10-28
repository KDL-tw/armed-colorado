import fs from "fs";
import path from "path";
import type { CommitteeCatalog } from "./types";

const CATALOG_FILE = "committee-catalog.json";
const CATALOG_PATH = path.join(process.cwd(), "data", CATALOG_FILE);

/**
 * Load the committee catalog from disk. Returns an empty catalog (not a
 * throw) on failure so the page still renders with a "no data" state.
 */
export async function loadCommitteeCatalog(): Promise<CommitteeCatalog> {
  try {
    const content = fs.readFileSync(CATALOG_PATH, "utf8");
    return JSON.parse(content);
  } catch (error) {
    console.error("Error loading committee catalog:", error);
    return { session: "", fetchedAt: "", committees: [] };
  }
}

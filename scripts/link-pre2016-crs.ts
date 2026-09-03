import * as path from "path";
import { loadCrsCache, type CrsLinkEntry } from "../src/lib/gun-bill/crs-links-cache";
import { loadCatalog, saveCatalog } from "../src/lib/gun-bill/assemble-catalog";
import type { GunBillCatalog } from "../src/lib/gun-bill/types";

const CATALOG_FILE = path.join(process.cwd(), "data", "gun-bill-catalog-20260828.json");
const CRS_CACHE_DIR = path.join(process.cwd(), ".cache", "crs-links");
const CRS_CACHE_FILE = path.join(CRS_CACHE_DIR, "cache.json");

async function main() {
  // Load CRS cache
  console.log("Loading CRS cache...");
  const crsCache = loadCrsCache();
  console.log(`Loaded ${crsCache.size} CRS link entries`);

  // Verify cache file exists
  if (!crsCache.size) {
    console.warn(`WARNING: No CRS entries found in ${CRS_CACHE_FILE}`);
    console.warn("The cache file may not exist or may be empty.");
  }

  // Load catalog
  console.log("\nLoading catalog...");
  const catalog: GunBillCatalog = loadCatalog(CATALOG_FILE);
  console.log(`Loaded catalog with ${catalog.length} years`);

  // Count bills and migrations
  let totalBills = 0;
  let migratedBills = 0;
  const notFound: string[] = [];

  // Process each bill
  for (const yearEntry of catalog) {
    for (const bill of yearEntry.bills) {
      totalBills++;
      
      // Check if CRS cache has entry for this bill
      const crsEntry = crsCache.get(bill.billNumber);
      
      if (crsEntry) {
        // Set CRS fields from cache
        bill.crsCitation = crsEntry.citation;
        bill.crsUrl = crsEntry.url;
        migratedBills++;
        
        if (process.argv.includes("--verbose")) {
          console.log(`  ${bill.billNumber}: ${crsEntry.citation}`);
        }
      } else {
        // No CRS entry found
        notFound.push(bill.billNumber);
      }
    }
  }

  // Save updated catalog
  console.log("\nSaving updated catalog...");
  saveCatalog(catalog, CATALOG_FILE);
  console.log(`Saved catalog to ${CATALOG_FILE}`);

  // Summary
  console.log("\n=== Migration Summary ===");
  console.log(`Total bills processed: ${totalBills}`);
  console.log(`Migrated with CRS links: ${migratedBills}`);
  console.log(`No CRS entry found: ${notFound.length}`);

  if (notFound.length > 0 && process.argv.includes("--verbose")) {
    console.log("\nBills without CRS entries:");
    for (const billNumber of notFound) {
      console.log(`  - ${billNumber}`);
    }
  }
}

main().catch(console.error);

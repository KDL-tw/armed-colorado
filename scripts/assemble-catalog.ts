import * as path from "path";
import { saveCatalog, loadRmgoScrapedData } from "../src/lib/gun-bill/assemble-catalog";
import { rmgoToCatalogEntryWithCoGaExtraction } from "../src/lib/gun-bill/extract-co-ga-bill-info";
import type { GunBillCatalogYear } from "../src/lib/gun-bill/types";

const RMGO_FILE = path.join(process.cwd(), "data", "rmgo-scraped-bills-20260828.json");
const OUTPUT_FILE = path.join(process.cwd(), "data", "gun-bill-catalog-20260828.json");
const TARGET_YEAR = process.argv.includes("--year")
  ? parseInt(process.argv[process.argv.indexOf("--year") + 1])
  : null;

async function main() {
  const rmgoData = loadRmgoScrapedData(RMGO_FILE);
  console.log(`Loaded RMGO data with ${Object.keys(rmgoData.years).length} years`);

  const totalBills = Object.values(rmgoData.years).reduce(
    (sum, bills) => sum + bills.length,
    0
  );
  console.log(`Total bills: ${totalBills}`);

  if (TARGET_YEAR) {
    console.log(`\nFiltering to year ${TARGET_YEAR} only`);
  }

  const sortedYears = Object.keys(rmgoData.years).sort(
    (a, b) => parseInt(b) - parseInt(a)
  );

  const catalog: GunBillCatalogYear[] = [];

  for (const yearStr of sortedYears) {
    const year = parseInt(yearStr);
    if (TARGET_YEAR && year !== TARGET_YEAR) continue;

    const bills = rmgoData.years[yearStr];
    const catalogBills = [];

    for (const rmgoBill of bills) {
      process.stdout.write(`  ${rmgoBill.billNumber}...`);
      const entry = await rmgoToCatalogEntryWithCoGaExtraction(rmgoBill);
      catalogBills.push(entry);
      const titleSource =
        entry.title === rmgoBill.subject.replace(/\*\*/g, "")
          ? "RMGO"
          : "CO-GA";
      console.log(` ${titleSource}: "${entry.title.substring(0, 50)}..."`);
    }

    catalog.push({ year, bills: catalogBills });
    console.log(`Year ${year}: ${catalogBills.length} bills processed`);
  }

  if (!TARGET_YEAR) {
    saveCatalog(catalog, OUTPUT_FILE);
    console.log(`\nSaved catalog to ${OUTPUT_FILE}`);
  } else {
    const sampleFile = path.join(
      process.cwd(),
      "data",
      `gun-bill-catalog-${TARGET_YEAR}-sample.json`
    );
    saveCatalog(catalog, sampleFile);
    console.log(`\nSaved sample catalog to ${sampleFile}`);
  }

  for (const year of catalog) {
    const coGaCount = year.bills.filter(
      (b) => !b.title.includes("*") && b.title !== b.billNumber
    ).length;
    console.log(
      `Year ${year.year}: ${year.bills.length} bills, ${coGaCount} with non-RMGO titles`
    );
  }
}

main().catch(console.error);

import { assembleCatalog, saveCatalog, loadRmgoScrapedData } from '../src/lib/gun-bill/assemble-catalog';
import { rmgoToCatalogEntry } from '../src/lib/gun-bill/assemble-catalog';
import type { GunBillCatalogEntry } from '../src/lib/gun-bill/types';

// Load scraped RMGO data
const rmgoData = loadRmgoScrapedData('../data/rmgo-scraped-bills-20260828.json');

console.log(`Loaded RMGO data with ${Object.keys(rmgoData.years).length} years`);

// Count total bills
const totalBills = Object.values(rmgoData.years).reduce((sum, bills) => sum + bills.length, 0);
console.log(`Total bills: ${totalBills}`);

// Show sample entry
const sampleYear = Object.keys(rmgoData.years)[0];
const sampleBill = rmgoData.years[sampleYear][0];
const sampleEntry = rmgoToCatalogEntry(sampleBill);

console.log('\nSample catalog entry:');
console.log(JSON.stringify(sampleEntry, null, 2));

// Assemble full catalog
const catalog = assembleCatalog(rmgoData);
console.log(`\nAssembled catalog with ${catalog.length} years`);

// Save catalog
saveCatalog(catalog, '../data/gun-bill-catalog-20260828.json');
console.log('\nSaved catalog to data/gun-bill-catalog-20260828.json');

// Show summary
for (const year of catalog) {
  console.log(`Year ${year.year}: ${year.bills.length} bills`);
}

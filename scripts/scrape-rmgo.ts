#!/usr/bin/env tsx
import { scrapeRmgoFromCache, saveScrapedData } from '../src/lib/gun-bill/scrape-rmgo.js';

const cachePath = '/home/noether/.hermes/cache/web/rmgo.org-60df06e2f2.md';
const outputPath = '/home/noether/renhorne/armed-colorado/data/rmgo-scraped-bills-20260828.json';

console.log('Scraping RMGO billwatch page...');
const data = scrapeRmgoFromCache(cachePath);

// Calculate totals
let totalBills = 0;
for (const year in data.years) {
  totalBills += data.years[year].length;
}

console.log(`Found ${Object.keys(data.years).length} years with ${totalBills} total bills`);

console.log(`Saving to ${outputPath}...`);
saveScrapedData(data, outputPath);
console.log('Done!');

// Print sample output
console.log('\nSample data (first 3 bills from 2026):');
if (data.years['2026'] && data.years['2026'].length > 0) {
  console.log(JSON.stringify(data.years['2026'].slice(0, 3), null, 2));
}

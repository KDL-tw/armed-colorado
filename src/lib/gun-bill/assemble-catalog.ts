import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import type {
  GunBillCatalog,
  GunBillCatalogEntry,
  GunBillCatalogYear,
  RmgoBill,
} from './types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Generate a 4-sentence summary for a bill from RMGO data
 */
export function generate2ASummary(bill: RmgoBill): string {
  const positionText = bill.position === 'Support' ? 'support' : bill.position === 'Oppose' ? 'oppose' : 'amend';
  const billNumber = bill.billNumber;
  const title = bill.subject.replace(/\*\*/g, ''); // Remove markdown bold

  // Extract key info from the bill data
  const statusText = bill.status;
  const location = bill.location;

  // Build the 4 sentences
  const sentence1 = `${billNumber} is a ${bill.position.toLowerCase()} bill that ${title.toLowerCase()}.`;
  const sentence2 = `The bill ${location.toLowerCase()} with a status of ${statusText.toLowerCase()}.`;
  const sentence3 = `From a 2A perspective, this bill ${positionText === 'support' ? 'strengthens' : positionText === 'oppose' ? 'threatens' : 'modifies'} Second Amendment rights in Colorado.`;
  const sentence4 = `The bill is currently ${statusText.toLowerCase()} and would take effect ${bill.enactmentDate || 'TBD'} if enacted.`;

  return `${sentence1} ${sentence2} ${sentence3} ${sentence4}`;
}

/**
 * Convert RMGO bill to catalog entry
 */
export function rmgoToCatalogEntry(rmgoBill: RmgoBill): GunBillCatalogEntry {
  const title = rmgoBill.subject.replace(/\*\*/g, '');
  const summary = generate2ASummary(rmgoBill);

  return {
    billNumber: rmgoBill.billNumber,
    title,
    summary,
    position: rmgoBill.position,
    status: rmgoBill.status,
    sponsors: rmgoBill.sponsors,
    location: rmgoBill.location,
    enactmentDate: rmgoBill.enactmentDate || undefined,
    officialUrl: rmgoBill.subjectUrl || undefined,
  };
}

/**
 * Assemble the gun bill catalog from RMGO scraped data
 */
export function assembleCatalog(rmgoData: { years: Record<string, RmgoBill[]> }): GunBillCatalogYear[] {
  const years: GunBillCatalogYear[] = [];

  // Sort years in reverse chronological order
  const sortedYears = Object.keys(rmgoData.years).sort((a, b) => parseInt(b) - parseInt(a));

  for (const yearStr of sortedYears) {
    const year = parseInt(yearStr);
    const bills = rmgoData.years[yearStr];

    const catalogBills: GunBillCatalogEntry[] = bills.map(rmgoToCatalogEntry);

    years.push({
      year,
      bills: catalogBills,
    });
  }

  return years;
}

/**
 * Load RMGO scraped data from JSON file
 */
export function loadRmgoScrapedData(filePath: string): { years: Record<string, RmgoBill[]> } {
  const content = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(content);
}

/**
 * Save catalog to JSON file for review
 */
export function saveCatalog(catalog: GunBillCatalogYear[], filePath: string): void {
  const content = JSON.stringify(catalog, null, 2);
  fs.writeFileSync(filePath, content, 'utf8');
}

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import type {
  GunBillCatalogEntry,
  GunBillCatalogYear,
  RmgoBill,
} from './types';
import { rmgoToCatalogEntryWithCoGaExtraction } from './extract-co-ga-bill-info';

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

/**
 * Extract bill text from CO GA PDF
 */
export async function extractBillTextFromPdf(pdfUrl: string): Promise<string> {
  // CO GA bill PDFs are at: https://leg.colorado.gov/bills/{billNumber}
  // The PDF link is typically: https://leg.colorado.gov/content/{billNumber}.pdf
  const pdfUrlNormalized = pdfUrl
    .replace('/bills/', '/content/')
    .replace(/[0-9]+$/, '.pdf');

  try {
    // web_extract is only available at runtime via Hermes tools
    // This function serves as a placeholder for runtime extraction
    // In production, this would use browser tool to extract from the page
    console.warn(`Extracting bill text from ${pdfUrlNormalized} requires Hermes browser tool`);
    return '';
  } catch (error) {
    console.error(`Error extracting PDF text from ${pdfUrlNormalized}:`, error);
    return '';
  }
}

/**
 * Generate a 4-sentence summary from bill text
 */
export function generateSummaryFromText(billNumber: string, billText: string): string {
  if (!billText || billText.length < 100) {
    return `${billNumber} - Unable to generate summary from bill text.`;
  }

  // Split into sentences (basic approach)
  const sentences = billText.match(/[^\.!?]+[\.!?]+/g) || [];

  if (sentences.length < 4) {
    // Fallback to current summary if not enough sentences
    return `Summary not available for ${billNumber}.`;
  }

  // Extract first 4 sentences for the summary
  const summarySentences = sentences.slice(0, 4).map((s) => s.trim());

  return summarySentences.join(' ');
}

/**
 * Convert RMGO bill to catalog entry with CO GA title extraction
 */
export async function rmgoToCatalogEntryWithCache(
  rmgoBill: RmgoBill
): Promise<GunBillCatalogEntry> {
  return rmgoToCatalogEntryWithCoGaExtraction(rmgoBill);
}

/**
 * Assemble the gun bill catalog from RMGO scraped data with caching
 */
export async function assembleCatalogWithCache(
  rmgoData: { years: Record<string, RmgoBill[]> },
  billTextCache?: Map<string, string>
): Promise<{ catalog: GunBillCatalogYear[]; cache: Map<string, string> }> {
  const cache = billTextCache || new Map<string, string>();
  const years: GunBillCatalogYear[] = [];

  // Sort years in reverse chronological order
  const sortedYears = Object.keys(rmgoData.years).sort((a, b) => parseInt(b) - parseInt(a));

  for (const yearStr of sortedYears) {
    const year = parseInt(yearStr);
    const bills = rmgoData.years[yearStr];

    const catalogBills: GunBillCatalogEntry[] = [];
    for (const rmgoBill of bills) {
      const entry = await rmgoToCatalogEntryWithCache(rmgoBill);
      catalogBills.push(entry);
    }

    years.push({
      year,
      bills: catalogBills,
    });
  }

  return { catalog: years, cache };
}

/**
 * Assemble catalog with automatic cache save
 * This is the main export that should be used
 */
export async function assembleCatalog(rmgoData: { years: Record<string, RmgoBill[]> }): Promise<GunBillCatalogYear[]> {
  const result = await assembleCatalogWithCache(rmgoData);
  return result.catalog;
}

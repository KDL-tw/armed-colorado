import * as fs from 'fs';
import type {
  GunBillCatalogEntry,
  GunBillCatalogYear,
  RmgoBill,
  SponsorLink,
} from './types';
export { type GunBillCatalogYear } from './types';
import { rmgoToCatalogEntryWithCoGaExtraction } from './extract-co-ga-bill-info';

/**
 * Neutral factual fallback summary from the RMGO subject, mirroring the
 * pre-2016 title-derived style. No bill number, position, status, or 2A
 * opinion — see the billwatch Summary spec in AGENTS.md.
 */
export function generate2ASummary(bill: RmgoBill): string {
  const title = bill.subject.replace(/\*\*/g, '').trim();
  const lower = title.charAt(0).toLowerCase() + title.slice(1);
  return `Concerns ${lower.replace(/\.$/, '')}.`;
}

/**
 * Convert RMGO bill to catalog entry
 */
export function rmgoToCatalogEntry(
  rmgoBill: RmgoBill,
  sponsorLinks?: SponsorLink[]
): GunBillCatalogEntry {
  const title = rmgoBill.subject.replace(/\*\*/g, '');
  const summary = generate2ASummary(rmgoBill);

  return {
    billNumber: rmgoBill.billNumber,
    title,
    summary,
    position: rmgoBill.position,
    status: rmgoBill.status,
    sponsors: rmgoBill.sponsors,
    sponsorLinks,
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
 * Load catalog from JSON file
 */
export function loadCatalog(filePath: string): GunBillCatalogYear[] {
  const content = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(content);
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

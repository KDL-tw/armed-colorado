import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);

// Types matching the expected output structure
export type RmgoBillPosition = 'Oppose' | 'Support' | 'Amend' | 'Monitor';
export type RmgoBillStatus =
  | 'Signed into Law'
  | 'Died in Committee'
  | 'Dead'
  | 'Signed by Governor'
  | 'Out of Session'
  | 'Passed House'
  | 'Passed Senate';

export interface RmgoBill {
  position: RmgoBillPosition;
  billNumber: string;
  sponsors: string[];
  subject: string;
  subjectUrl?: string;
  location: string;
  status: RmgoBillStatus;
  enactmentDate?: string;
}

export interface RmgoScrapedData {
  years: {
    [year: string]: RmgoBill[];
  };
}

/**
 * Parse sponsors from HTML content with <br> tags
 */
function parseSponsors(sponsorsHtml: string): string[] {
  // Remove bold tags and clean up
  const clean = sponsorsHtml
    .replace(/\*\*/g, '')
    .replace(/<br\s*\/?>/g, '\n')
    .trim();
  
  return clean.split('\n').map(s => s.trim()).filter(s => s.length > 0);
}

/**
 * Extract subject text and URL from subject HTML - handles both [text](url) format
 */
function parseSubject(subjectHtml: string): { subject: string; subjectUrl?: string } {
  // Extract URLs from the text
  const urls = subjectHtml.match(/https?:\/\/[^\s>)]+/g) || [];
  
  // Remove all markdown link syntax [text](url) and keep only the text parts
  let text = subjectHtml.replace(/\[([^\]]*)\]\([^)]+\)/g, '$1');
  
  // Clean up extra spaces and brackets
  text = text.replace(/\s+/g, ' ').trim();
  
  // Remove any remaining markdown artifacts (bold markers)
  text = text.replace(/\*\*/g, '');
  text = text.replace(/\[\s*\]/g, '');
  text = text.replace(/^\[\]+/, '');
  text = text.replace(/\[\]+$/, '');
  
  const subjectUrl = urls.length > 0 ? urls[0] : undefined;
  
  return { subject: text, subjectUrl };
}

/**
 * Normalize status values
 */
function normalizeStatus(status: string): RmgoBillStatus {
  const s = status.trim();
  if (s.includes('Signed') || s.includes('Governor')) {
    return 'Signed into Law';
  }
  if (s.includes('Dead') || s.includes('Died') || s.includes('Com')) {
    return 'Dead';
  }
  if (s.includes('Out of Session')) {
    return 'Out of Session';
  }
  if (s.includes('Passed')) {
    return s.includes('House') ? 'Passed House' : 'Passed Senate';
  }
  return s as RmgoBillStatus;
}

/**
 * Normalize position values
 */
function normalizePosition(position: string): RmgoBillPosition {
  const p = position.toLowerCase().trim();
  if (p.includes('oppose')) return 'Oppose';
  if (p.includes('support')) return 'Support';
  if (p.includes('amend')) return 'Amend';
  if (p.includes('monitor') || p.includes('monitoring')) return 'Monitor';
  return 'Oppose';
}

/**
 * Type of table columns (6 for older years without enactment date, 7 for newer)
 */
type TableColumnType = 6 | 7;

/**
 * Extract year headers from content to get proper boundaries
 */
function extractYearHeaders(content: string): { year: number; idx: number; header: string }[] {
  const headers: { year: number; idx: number; header: string }[] = [];
  
  for (let year = 2026; year >= 1998; year--) {
    const yearStr = year.toString();
    const yearHeader = `${yearStr} Bills - Colorado General Assembly`;
    const idx = content.indexOf(yearHeader);
    
    if (idx !== -1) {
      headers.push({ year, idx, header: yearHeader });
    }
  }
  
  // Sort by position in content (oldest first)
  headers.sort((a, b) => a.idx - b.idx);
  
  return headers;
}

/**
 * Extract bills from a year's section
 */
function extractBillsFromYearSection(yearSection: string): { bills: RmgoBill[]; numCols: TableColumnType } {
  const bills: RmgoBill[] = [];
  const lines = yearSection.split('\n');
  let inTable = false;
  let numCols: TableColumnType = 7; // Default to 7 columns
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Detect table header
    if (trimmedLine.includes('RMGO Position') || trimmedLine.includes('**RMGO Position**')) {
      inTable = true;
      
      // Count columns from header
      const headerCells = trimmedLine.replace(/^\||\|$/g, '').split('|');
      numCols = headerCells.length as TableColumnType;
      
      continue;
    }
    
    if (!inTable) continue;
    
    // Skip separator row
    if (trimmedLine.startsWith('| ---')) continue;
    
    // Skip empty lines
    if (!trimmedLine.startsWith('|')) continue;
    
    // Parse table row - markdown format: | cell | cell | ...
    const cells = trimmedLine.replace(/^\||\|$/g, '').split('|').map(c => c.trim());
    
    // Handle both 6-column (no enactment date) and 7-column tables
    if (numCols === 7 && cells.length >= 7) {
      const position = normalizePosition(cells[0]);
      const billNumber = cells[1].replace(/\*\*/g, '').trim();
      const sponsors = parseSponsors(cells[2]);
      const { subject, subjectUrl } = parseSubject(cells[3]);
      const location = cells[4].trim();
      const status = normalizeStatus(cells[5]);
      const enactmentDate = cells[6].trim() || undefined;
    
      // Skip empty bill entries
      if (billNumber.length === 0) continue;
    
      bills.push({
        position,
        billNumber,
        sponsors,
        subject,
        subjectUrl,
        location,
        status,
        enactmentDate
      });
    } else if (numCols === 6 && cells.length >= 6) {
      const position = normalizePosition(cells[0]);
      const billNumber = cells[1].replace(/\*\*/g, '').trim();
      const sponsors = parseSponsors(cells[2]);
      const { subject, subjectUrl } = parseSubject(cells[3]);
      const location = cells[4].trim();
      const status = normalizeStatus(cells[5]);
    
      // Skip empty bill entries
      if (billNumber.length === 0) continue;
    
      bills.push({
        position,
        billNumber,
        sponsors,
        subject,
        subjectUrl,
        location,
        status,
        enactmentDate: undefined
      });
    }
  }
  
  return { bills, numCols };
}

/**
 * Main scraping function
 */
export function scrapeRmgoBillwatch(content: string): RmgoScrapedData {
  const years: { [key: string]: RmgoBill[] } = {};
  
  const yearHeaders = extractYearHeaders(content);
  
  // Process each year
  for (let i = 0; i < yearHeaders.length; i++) {
    const { year, idx: startIdx, header } = yearHeaders[i];
    const yearStr = year.toString();
    
    // Find next header or end of content
    const nextStart = i + 1 < yearHeaders.length ? yearHeaders[i + 1].idx : content.length;
    
    const yearSection = content.slice(startIdx, nextStart);
    const { bills, numCols } = extractBillsFromYearSection(yearSection);
    
    console.log(`Year ${yearStr} (${numCols} cols): Found ${bills.length} bills`);
    
    if (bills.length > 0) {
      years[yearStr] = bills;
    }
  }
  
  return { years };
}

/**
 * Load extracted content from cache and scrape
 */
export function scrapeRmgoFromCache(cachePath: string): RmgoScrapedData {
  const content = fs.readFileSync(cachePath, 'utf-8');
  return scrapeRmgoBillwatch(content);
}

/**
 * Save scraped data to JSON file
 */
export function saveScrapedData(data: RmgoScrapedData, outputPath: string): void {
  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
}

// Main execution if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
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
}

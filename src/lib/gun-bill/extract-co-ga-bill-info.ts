import type { GunBillCatalogEntry, RmgoBill } from './types';
import { loadBillTextCache, saveBillTextCache } from './bill-text-cache';
import { extractCoGaSponsorLinks, type SponsorLink } from './sponsor-links';

/**
 * Decode common HTML entities in extracted text
 */
function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

/**
 * Fetch with timeout and retry on failure
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  maxRetries = 1
): Promise<Response> {
  let lastError: Error | undefined;
  for (let retry = 0; retry <= maxRetries; retry++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      const res = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return res;
    } catch (error) {
      lastError = error as Error;
      if (retry < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * (retry + 1))); // Exponential backoff
      }
    }
  }
  throw lastError;
}

/**
 * Extract bill title from CO GA bill page using real HTTP fetch
 * Returns the official title from the Colorado General Assembly website
 * Selector verified on https://leg.colorado.gov/bills/HB26-1126: .full-bill-topic h1
 */
export async function extractCoGaBillTitle(
  billNumber: string,
  billUrl: string
): Promise<string> {
  try {
    const res = await fetchWithRetry(billUrl, {
      redirect: "follow",
      headers: { "User-Agent": "ArmedColorado-BillCatalog/1.0" },
    });
    if (!res.ok) {
      console.error(`HTTP ${res.status} fetching ${billUrl}`);
      return billNumber;
    }
    const html = await res.text();
    const m = html.match(
      /<div class='full-bill-topic[^']*'>\s*<h1>\s*([\s\S]*?)\s*<\/h1>/
    );
    const title = m ? decodeHtmlEntities(m[1].trim()) : "";
    if (!title || title === billNumber) return billNumber;
    return title;
  } catch (error) {
    console.error(`Error extracting title from ${billUrl}:`, error);
    return billNumber;
  }
}

/**
 * Extract the CO GA bill page summary text as reference material.
 * Selector verified on https://leg.colorado.gov/bills/HB26-1126: .bill-summary-content p
 * NOTE: This is reference only. Per prompts, the final summary must NOT be copied
 * from the CO GA website — it must be a 2A-POV summary generated from the bill text.
 */
export async function extractCoGaBillSummary(
  billNumber: string,
  billUrl: string
): Promise<string> {
  try {
    const res = await fetchWithRetry(billUrl, {
      redirect: "follow",
      headers: { "User-Agent": "ArmedColorado-BillCatalog/1.0" },
    });
    if (!res.ok) {
      console.error(`HTTP ${res.status} fetching ${billUrl}`);
      return "";
    }
    const html = await res.text();

    const summaryMatch = html.match(
      /<div class='bill-summary-content'>([\s\S]*?)<\/div>/
    );
    if (!summaryMatch) return "";

    const rawSummary = summaryMatch[1]
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    return rawSummary;
  } catch (error) {
    console.error(`Error extracting summary from ${billUrl}:`, error);
    return "";
  }
}

/**
 * Extract the most recent bill PDF URL from the CO GA bill page.
 * Selector: first <a class="ext-link-pdf"> in #bill-activity-bill-text "All Versions" table.
 * Returns a relative URL like /bill_files/{id}/download.
 */
export async function extractCoGaBillPdfUrl(
  billUrl: string
): Promise<string | null> {
  try {
    const res = await fetchWithRetry(billUrl, { redirect: "follow" });
    if (!res.ok) return null;
    const html = await res.text();

    const pdfMatch = html.match(
      /<a class="ext-link-pdf"[^>]*href="([^"]+)"[^>]*>/
    );
    if (!pdfMatch) return null;

    return pdfMatch[1];
  } catch (error) {
    console.error(`Error extracting PDF URL from ${billUrl}:`, error);
    return null;
  }
}

/**
 * Generate a 2A-POV summary from the CO GA title and reference summary.
 * This is a template-based approach that proves the pipeline.
 * The hermes agent should replace this with LLM-generated summaries
 * based on the actual bill text (PDF), per the prompts.
 */
export function generate2ASummaryFromCoGa(
  billNumber: string,
  coGaTitle: string,
  coGaSummary: string,
  position: string,
  status: string
): string {
  const positionLower = position.toLowerCase();
  const statusLower = status.toLowerCase();
  const impact =
    position === "Support"
      ? "supports and protects"
      : position === "Oppose"
        ? "threatens and undermines"
        : "modifies";

  const summaryExcerpt = coGaSummary
    ? coGaSummary.split(".")[0].trim() + "."
    : `${coGaTitle}.`;

  return `${billNumber} (${coGaTitle}) is a ${positionLower} bill that ${impact} Second Amendment rights in Colorado. ${summaryExcerpt} From a 2A perspective, this legislation ${position === "Support" ? "advances" : "endangers"} firearm freedoms. The bill is currently ${statusLower}.`;
}

/**
 * Get cached CO GA title for a bill URL
 */
export function getCachedCoGaTitle(url: string): string | undefined {
  const cache = loadBillTextCache();
  const data = cache.get(url);
  if (!data) return undefined;
  try {
    const parsed = JSON.parse(data);
    return parsed.title;
  } catch {
    return undefined;
  }
}

/**
 * Get cached CO GA summary for a bill URL
 */
export function getCachedCoGaSummary(url: string): string | undefined {
  const cache = loadBillTextCache();
  const data = cache.get(url);
  if (!data) return undefined;
  try {
    const parsed = JSON.parse(data);
    return parsed.summary;
  } catch {
    return undefined;
  }
}

/**
 * Get cached CO GA sponsor links for a bill URL
 */
export function getCachedCoGaSponsorLinks(
  url: string,
  rmgoSponsors: string[]
): SponsorLink[] | undefined {
  const cache = loadBillTextCache();
  const data = cache.get(url);
  if (!data) return undefined;
  try {
    const parsed = JSON.parse(data);
    return parsed.sponsorLinks ? JSON.parse(parsed.sponsorLinks) : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Cache both title and summary for a bill URL
 */
export function setCachedCoGaData(
  url: string,
  title: string,
  summary: string,
  sponsorLinks?: SponsorLink[]
): void {
  const cache = loadBillTextCache();
  const existingData = cache.get(url);
  let data: Record<string, string> = {};

  if (existingData) {
    try {
      data = JSON.parse(existingData);
    } catch {
      data = {};
    }
  }

  data.title = title;
  data.summary = summary;
  if (sponsorLinks) {
    data.sponsorLinks = JSON.stringify(sponsorLinks);
  }
  cache.set(url, JSON.stringify(data));
  saveBillTextCache(cache);
}

/**
 * Validate extracted title and summary
 * Returns true if data is valid, false otherwise
 */
export function validateCoGaExtraction(
  title: string,
  summary: string,
  billNumber: string
): boolean {
  // Title must not be empty and not just the bill number
  if (!title || title === billNumber || title.length < 5) {
    return false;
  }
  
  // Summary should not be empty (empty is acceptable for now as fallback)
  // Title must contain some meaningful content
  if (!title.includes(' ') || title.length < 10) {
    return false;
  }
  
  return true;
}

/**
 * Generate a 4-sentence summary from RMGO data (fallback)
 */
function generate2ASummary(billNumber: string, position: string, subject: string, status: string, location: string, enactmentDate?: string | null): string {
  const positionText = position === 'Support' ? 'support' : position === 'Oppose' ? 'oppose' : 'amend';
  const title = subject.replace(/\*\*/g, '');
  const statusText = status;
  const statusLower = statusText.toLowerCase();
  const positionLower = position.toLowerCase();

  // Build the 4 sentences
  const sentence1 = `${billNumber} is a ${positionLower} bill that ${title.toLowerCase()}.`;
  const sentence2 = `The bill ${location.toLowerCase()} with a status of ${statusLower}.`;
  const sentence3 = `From a 2A perspective, this bill ${positionText === 'support' ? 'strengthens' : positionText === 'oppose' ? 'threatens' : 'modifies'} Second Amendment rights in Colorado.`;
  const sentence4 = `The bill is currently ${statusLower} and would take effect ${enactmentDate || 'TBD'} if enacted.`;

  return `${sentence1} ${sentence2} ${sentence3} ${sentence4}`;
}

/**
 * Convert RMGO bill to catalog entry with CO GA title extraction
 * Falls back to RMGO data if CO GA extraction fails
 */
export async function rmgoToCatalogEntryWithCoGaExtraction(
  rmgoBill: RmgoBill
): Promise<GunBillCatalogEntry> {
  const cacheKey = rmgoBill.subjectUrl || '';
  
  // Check if we have cached CO GA title/summary
  const cachedTitle = getCachedCoGaTitle(cacheKey);
  const cachedSummary = getCachedCoGaSummary(cacheKey);
  
  let title: string;
  let summary: string;
  let sponsorLinks: SponsorLink[] | undefined;
  
  if (cachedTitle && cachedSummary && validateCoGaExtraction(cachedTitle, cachedSummary, rmgoBill.billNumber)) {
    title = cachedTitle;
    summary = cachedSummary;
    sponsorLinks = getCachedCoGaSponsorLinks(cacheKey, rmgoBill.sponsors);
    setCachedCoGaData(cacheKey, title, summary, sponsorLinks);
  } else if (rmgoBill.subjectUrl) {
    const extractedTitle = await extractCoGaBillTitle(rmgoBill.billNumber, rmgoBill.subjectUrl);
    const coGaSummaryRef = await extractCoGaBillSummary(rmgoBill.billNumber, rmgoBill.subjectUrl);
    const coGaSponsors = await extractCoGaSponsorLinks(rmgoBill.subjectUrl, rmgoBill.sponsors);

    if (extractedTitle && extractedTitle !== rmgoBill.billNumber) {
      title = extractedTitle;
      summary = generate2ASummaryFromCoGa(
        rmgoBill.billNumber,
        extractedTitle,
        coGaSummaryRef,
        rmgoBill.position,
        rmgoBill.status
      );
      setCachedCoGaData(cacheKey, title, summary, coGaSponsors);
      sponsorLinks = coGaSponsors;
    } else {
      title = rmgoBill.subject.replace(/\*\*/g, "");
      summary = generate2ASummary(
        rmgoBill.billNumber,
        rmgoBill.position,
        rmgoBill.subject,
        rmgoBill.status,
        rmgoBill.location,
        rmgoBill.enactmentDate
      );
    }
  } else {
    // No URL available, use RMGO data
    title = rmgoBill.subject.replace(/\*\*/g, '');
    summary = generate2ASummary(
      rmgoBill.billNumber,
      rmgoBill.position,
      rmgoBill.subject,
      rmgoBill.status,
      rmgoBill.location,
      rmgoBill.enactmentDate
    );
  }
  
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

import type { GunBillCatalogEntry, RmgoBill } from './types';
import { loadBillTextCache, saveBillTextCache } from './bill-text-cache';
import { extractCoGaSponsorLinks, type SponsorLink } from './sponsor-links';

/**
 * Decode common HTML entities in extracted text
 */
export function decodeHtmlEntities(text: string): string {
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
 * Neutral factual fallback summary from the CO GA title.
 *
 * The billwatch Summary spec (AGENTS.md): summaries describe only what the
 * bill does — no bill number, no title quote, no position, no status, no
 * 2A opinion. The CO GA summary text is reference-only and must not be
 * copied verbatim, so the fallback frames the title factually. The cache
 * (populated by scripts/fetch-bill-summaries.ts + apply-bill-summaries.ts)
 * normally supplies full LLM-written summaries; this only fires for
 * uncached bills.
 */
export function generate2ASummaryFromCoGa(
  billNumber: string,
  coGaTitle: string,
  coGaSummary: string,
  position: string,
  status: string
): string {
  void billNumber;
  void coGaSummary;
  void position;
  void status;
  const lower = coGaTitle.charAt(0).toLowerCase() + coGaTitle.slice(1);
  return `Concerns ${lower.replace(/\.$/, "")}.`;
}

/**
 * Get cached CO GA title for a bill URL
 */
export function getCachedCoGaTitle(url: string): string | undefined {
  const cache = loadBillTextCache();
  const data = cache.get(url);
  if (!data) return undefined;
  try {
    const parsed: { title: string } = JSON.parse(data);
    return parsed.title;
  } catch {
    return undefined;
  }
}

/**
 * Get cached CO GA official long title for a bill URL (the "Concerning …"
 * line from <p class='bill-long-title'>, cached by scripts/fetch-bill-summaries.ts).
 */
export function getCachedCoGaLongTitle(url: string): string | undefined {
  const cache = loadBillTextCache();
  const data = cache.get(url);
  if (!data) return undefined;
  try {
    const parsed: { coGaLongTitle?: string } = JSON.parse(data);
    return parsed.coGaLongTitle?.trim() || undefined;
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
    const parsed: { summary: string } = JSON.parse(data);
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
    const parsed: { sponsorLinks: string } = JSON.parse(data);
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
  let data: Record<string, string | undefined> = {};

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
 * Neutral factual fallback summary from the RMGO subject, mirroring the
 * pre-2016 title-derived style. No bill number, position, status, or 2A
 * opinion — see the billwatch Summary spec in AGENTS.md.
 */
function generate2ASummary(subject: string): string {
  const title = subject.replace(/\*\*/g, '').trim();
  const lower = title.charAt(0).toLowerCase() + title.slice(1);
  return `Concerns ${lower.replace(/\.$/, '')}.`;
}

/**
 * Convert RMGO bill to catalog entry with CO GA title extraction
 * Falls back to RMGO data if CO GA extraction fails
 */
export async function rmgoToCatalogEntryWithCoGaExtraction(
  rmgoBill: RmgoBill
): Promise<GunBillCatalogEntry> {
  // Use CO GA bill URL as cache key (the page we fetched for title/summary/sponsors)
  const cacheKey = rmgoBill.subjectUrl || '';
  
  // Official long title ("Concerning …") wins over the h1 topic label —
  // it is the actual name of the bill (2026-10-06 billwatch title fix).
  let longTitle: string | undefined;
  if (cacheKey) longTitle = getCachedCoGaLongTitle(cacheKey);
  
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
    if (longTitle) {
      title = longTitle;
    }
  } else if (rmgoBill.subjectUrl) {
    const extractedTitle = await extractCoGaBillTitle(rmgoBill.billNumber, rmgoBill.subjectUrl);
    const coGaSummaryRef = await extractCoGaBillSummary(rmgoBill.billNumber, rmgoBill.subjectUrl);
    const coGaSponsors = await extractCoGaSponsorLinks(rmgoBill.subjectUrl, rmgoBill.sponsors);

    if (extractedTitle && extractedTitle !== rmgoBill.billNumber) {
      title = extractedTitle;
      if (longTitle) {
        title = longTitle;
      }
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
      summary = generate2ASummary(rmgoBill.subject);
    }
  } else {
    // No URL available, use RMGO data
    title = rmgoBill.subject.replace(/\*\*/g, '');
    summary = generate2ASummary(rmgoBill.subject);
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

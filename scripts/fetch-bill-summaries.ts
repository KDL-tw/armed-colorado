/**
 * Fetch and cache the RAW CO GA bill summaries + long titles for all live
 * bills (year groups 2016-2026) — reference material for writing factual
 * bill summaries. The raw text is NOT the display summary: it is stored in
 * new cache fields (coGaSummaryRaw, coGaLongTitle) per URL, preserving each
 * entry's existing title/summary/sponsorLinks per the cache invariant.
 *
 * Also exports a worklist (/tmp/opencode/summaries-worklist.json) with one
 * entry per live bill for the summary-writing pass.
 *
 * Usage: npx tsx scripts/fetch-bill-summaries.ts [--refresh] [--year 2026]
 */

import * as fs from 'fs';
import * as path from 'path';
import { decodeHtmlEntities } from '../src/lib/gun-bill/extract-co-ga-bill-info';
import {
  loadBillTextCache,
  saveBillTextCache,
} from '../src/lib/gun-bill/bill-text-cache';

interface YearGroup {
  year: number;
  bills: { billNumber: string; officialUrl: string }[];
}

interface WorkItem {
  billNumber: string;
  url: string;
  title: string;
  longTitle: string;
  rawSummary: string;
}

const UA = 'ArmedColorado-BillCatalog/1.0';
const DELAY_MS = 400;
const FETCH_TIMEOUT_MS = 30_000;
const RETRIES = 2;
const WORKLIST = '/tmp/opencode/summaries-worklist.json';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function clean(text: string): string {
  return decodeHtmlEntities(
    text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')
  ).trim();
}

async function fetchPage(url: string): Promise<string | null> {
  for (let attempt = 0; attempt <= RETRIES; attempt++) {
    try {
      const res = await fetch(url, {
        redirect: 'follow',
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
        headers: { 'User-Agent': UA },
      });
      if (!res.ok) {
        if (res.status === 403 || res.status === 404) return null;
        throw new Error(`HTTP ${res.status}`);
      }
      return await res.text();
    } catch (err) {
      if (attempt === RETRIES) {
        console.error(`  FETCH FAILED ${url}: ${err}`);
        return null;
      }
      await sleep(2000);
    }
  }
  return null;
}

async function main() {
  const refresh = process.argv.includes('--refresh');
  const yearIdx = process.argv.indexOf('--year');
  const yearArg = yearIdx >= 0 ? process.argv[yearIdx + 1] : undefined;

  const catalogPath = path.join(process.cwd(), 'data/gun-bill-catalog-20260828.json');
  const catalog: YearGroup[] = JSON.parse(fs.readFileSync(catalogPath, 'utf-8'));
  const cache = loadBillTextCache();

  const worklist: WorkItem[] = [];
  const stats = { fetched: 0, fromCache: 0, failed: 0, noSummary: 0, skippedNoUrl: 0 };

  for (const y of catalog) {
    if (y.year < 2016 || y.year > 2026) continue;
    if (yearArg && String(y.year) !== String(yearArg)) continue;

    for (const bill of y.bills) {
      const url = bill.officialUrl;
      if (!url || url.includes('%20') || !url.startsWith('https://leg.colorado.gov/bills/')) {
        stats.skippedNoUrl++;
        continue;
      }

      let rawSummary = '';
      let longTitle = '';

      const raw = cache.get(url);
      let entry: Record<string, string> = {};
      if (raw) {
        try { entry = JSON.parse(raw); } catch { entry = {}; }
      }

      if (!refresh && entry.coGaSummaryRaw) {
        rawSummary = entry.coGaSummaryRaw;
        longTitle = entry.coGaLongTitle || '';
        stats.fromCache++;
      } else {
        const html = await fetchPage(url);
        if (html === null) {
          stats.failed++;
          // still record what we know from the cache, if anything
          if (entry.title) {
            worklist.push({
              billNumber: bill.billNumber, url,
              title: entry.title, longTitle: entry.coGaLongTitle || '',
              rawSummary: entry.coGaSummaryRaw || '',
            });
          }
          await sleep(DELAY_MS);
          continue;
        }
        const sm = html.match(/<div class='bill-summary-content'>([\s\S]*?)<\/div>/);
        rawSummary = sm ? clean(sm[1]) : '';
        const lt = html.match(/bill-long-title[^>]*>\s*([\s\S]*?)<\/p>/);
        longTitle = lt ? clean(lt[1]) : '';
        stats.fetched++;
        if (!rawSummary) stats.noSummary++;

        entry.coGaSummaryRaw = rawSummary;
        entry.coGaLongTitle = longTitle;
        cache.set(url, JSON.stringify(entry));
        await sleep(DELAY_MS);
      }

      worklist.push({
        billNumber: bill.billNumber,
        url,
        title: entry.title || '',
        longTitle,
        rawSummary,
      });
    }
  }

  saveBillTextCache(cache);
  fs.writeFileSync(WORKLIST, JSON.stringify(worklist, null, 1));

  console.log(`Fetched: ${stats.fetched} | from cache: ${stats.fromCache} | failed: ${stats.failed}`);
  console.log(`No summary on page: ${stats.noSummary} | skipped (no valid URL): ${stats.skippedNoUrl}`);
  console.log(`Worklist entries: ${worklist.length} -> ${WORKLIST}`);
  const withRef = worklist.filter((w) => w.rawSummary || w.longTitle).length;
  console.log(`Worklist entries with reference material: ${withRef}`);
}

main();

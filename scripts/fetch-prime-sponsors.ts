/**
 * Populate the billwatch Sponsors column with the PRIME sponsors listed on
 * each bill's CO GA page — the source of truth. Bills in year groups 2016+
 * have live pages (<h2>Prime Sponsors</h2> tiles); pre-2016 bills have no
 * live pages (CO GA serves 2016+ only) and keep RMGO's sponsors as the
 * fallback, per the documented pipeline design.
 *
 * - Fetches each live bill page, extracts primes via extractPageSponsors()
 *   (name + slug + chamber from the tile), and sets sponsorLinks to exactly
 *   that list, formatted "Rep. Emily Sirota" / "Sen. Cathy Kipp".
 * - Caches the extracted primes per URL in .cache/bill-text/cache.json
 *   (preserving each entry's title/summary — the documented invariant), so
 *   re-runs are cache-first (use --refresh to force re-fetch) and future
 *   catalog regenerations can read them instead of wiping.
 * - On fetch/parse failure a bill keeps its existing (RMGO-derived) links —
 *   graceful degradation, never lose a row.
 *
 * Usage: npx tsx scripts/fetch-prime-sponsors.ts [--dry-run] [--refresh] [--year 2026]
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  extractPageSponsors,
  type SponsorLink,
} from '../src/lib/gun-bill/sponsor-links';
import {
  loadBillTextCache,
  saveBillTextCache,
} from '../src/lib/gun-bill/bill-text-cache';

interface YearGroup {
  year: number;
  bills: Bill[];
}

interface Bill {
  billNumber: string;
  officialUrl: string;
  sponsors: string | string[];
  sponsorLinks?: SponsorLink[];
}

const UA = 'ArmedColorado-BillCatalog/1.0';
const DELAY_MS = 400;
const FETCH_TIMEOUT_MS = 30_000;
const RETRIES = 2;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function fetchPage(url: string): Promise<string | null> {
  for (let attempt = 0; attempt <= RETRIES; attempt++) {
    try {
      const res = await fetch(url, {
        redirect: 'follow',
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
        headers: { 'User-Agent': UA },
      });
      if (!res.ok) {
        if (res.status === 403 || res.status === 404) return null; // no live page
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

function toLinks(primes: ReturnType<typeof extractPageSponsors>): SponsorLink[] {
  return primes.map((p) => ({
    name: `${p.chamber === 'Senate' ? 'Sen.' : 'Rep.'} ${p.displayName}`,
    slug: p.slug,
  }));
}

function slugStats(catalog: YearGroup[]) {
  let bills = 0;
  let slugs = 0;
  for (const y of catalog) {
    for (const b of y.bills) {
      if ((b.sponsorLinks ?? []).some((l) => l.slug)) bills++;
      slugs += (b.sponsorLinks ?? []).filter((l) => l.slug).length;
    }
  }
  return { bills, slugs };
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const refresh = process.argv.includes('--refresh');
  const yearIdx = process.argv.indexOf('--year');
  const yearArg = yearIdx >= 0 ? process.argv[yearIdx + 1] : undefined;

  const catalogPath = path.join(process.cwd(), 'data/gun-bill-catalog-20260828.json');
  const catalog: YearGroup[] = JSON.parse(fs.readFileSync(catalogPath, 'utf-8'));
  const cache = loadBillTextCache();

  const before = slugStats(catalog);
  const stats = {
    liveGroups: 0, fetched: 0, fromCache: 0, updated: 0,
    keptFallback: 0, skippedNoUrl: 0, pre2016: 0,
  };
  const samples: string[] = [];

  for (const y of catalog) {
    if (y.year < 2016 || y.year > 2026) {
      stats.pre2016 += y.bills.length; // RMGO fallback by design
      continue;
    }
    stats.liveGroups++;
    if (yearArg && String(y.year) !== String(yearArg)) continue;

    for (const bill of y.bills) {
      const url = bill.officialUrl;
      if (!url || url.includes('%20') || !url.startsWith('https://leg.colorado.gov/bills/')) {
        stats.skippedNoUrl++;
        continue;
      }

      let primes: SponsorLink[] | null = null;

      // Cache-first (unless --refresh): reuse previously extracted primes
      if (!refresh) {
        const raw = cache.get(url);
        if (raw) {
          try {
            const entry = JSON.parse(raw);
            if (entry.sponsorLinks) {
              primes = JSON.parse(entry.sponsorLinks);
              stats.fromCache++;
            }
          } catch { /* fall through to fetch */ }
        }
      }

      if (!primes) {
        const html = await fetchPage(url);
        if (html === null) {
          stats.keptFallback++;
          await sleep(DELAY_MS);
          continue;
        }
        const extracted = extractPageSponsors(html);
        stats.fetched++;
        if (extracted.length === 0) {
          stats.keptFallback++; // no prime section — keep RMGO-derived links
          await sleep(DELAY_MS);
          continue;
        }
        primes = toLinks(extracted);

        // Cache the primes (preserving title/summary per the invariant)
        if (!dryRun) {
          const raw = cache.get(url);
          let entry: Record<string, string> = {};
          if (raw) {
            try { entry = JSON.parse(raw); } catch { entry = {}; }
          }
          entry.sponsorLinks = JSON.stringify(primes);
          cache.set(url, JSON.stringify(entry));
        }
      }

      const changed = JSON.stringify(primes) !== JSON.stringify(bill.sponsorLinks ?? []);
      if (changed) {
        bill.sponsorLinks = primes;
        stats.updated++;
        if (samples.length < 8) {
          samples.push(`  ${bill.billNumber}: ${primes.map((p) => p.name).join('; ')}`);
        }
      }
      await sleep(DELAY_MS);
    }
  }

  const after = slugStats(catalog);
  const rows = catalog.reduce((n, y) => n + y.bills.length, 0);

  console.log(`Bills: ${rows} (pre-2016 RMGO fallback: ${stats.pre2016})`);
  console.log(`Fetched: ${stats.fetched} | from cache: ${stats.fromCache} | no URL: ${stats.skippedNoUrl}`);
  console.log(`Updated: ${stats.updated} | kept fallback (fetch/parse fail or no prime section): ${stats.keptFallback}`);
  console.log(`bills_with_live_slugs: ${before.bills} -> ${after.bills}`);
  console.log(`total_live_slugs: ${before.slugs} -> ${after.slugs}`);
  console.log('Sample updates:');
  console.log(samples.join('\n'));

  if (dryRun) {
    console.log('\n[dry-run] catalog and cache NOT written.');
    return;
  }

  fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2) + '\n');
  saveBillTextCache(cache);
  console.log('\nCatalog written:', catalogPath);
  console.log('Cache updated with prime sponsorLinks per URL.');
  console.log('If the aggregate change is intentional, update .cache/regression-baselines.json:');
  console.log(JSON.stringify({ bills_with_live_slugs: after.bills, total_live_slugs: after.slugs, total_bills: rows }));
}

main();

/**
 * Apply Enacted (governor signing) dates to the billwatch catalog.
 *
 * Sources (extracted by scripts/fetch-enacted-dates.ts):
 * - Post-2016 bills: the "Signed Act" row of the Bill Text "All Versions"
 *   table on the CO GA bill page (https://leg.colorado.gov/bills/{num}).
 *   Dates arrive MM/DD/YYYY.
 * - Pre-2016 bills: the note at the top of the archived bill-text PDF,
 *   "NOTE: The governor signed this measure on <date>." Dates arrive
 *   M/D/YYYY and are normalized to zero-padded MM/DD/YYYY.
 *
 * Only bills with status "Signed into Law" receive a date; every other
 * bill's Enacted cell renders as an em-dash.
 *
 * The script:
 * 1. Reads the two extraction result files (post2016-dates.json,
 *    pre2016-dates.json).
 * 2. Validates every date (MM/DD/YYYY, real calendar date, sane year).
 * 3. Sets `enactmentDate` on the matching catalog entry, matched by
 *    (year, billNumber) — the year disambiguates the known RMGO
 *    mis-listing (HB19-1022 exists in both 2019 and 2013).
 * 4. Caches each date under the bill's URL in .cache/bill-text/cache.json
 *    (field `enactedDate`, preserving all other entry fields per the
 *    documented invariant) so a future catalog regeneration can restore
 *    them instead of losing them.
 *
 * Usage: npx tsx scripts/apply-enacted-dates.ts [--dry-run]
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  loadBillTextCache,
  saveBillTextCache,
} from '../src/lib/gun-bill/bill-text-cache';
import type { GunBillCatalogYear } from '../src/lib/gun-bill/types';

interface DateRecord {
  year: number;
  bill: string;
  url: string;
  date: string | null;
  status: 'ok' | 'missing' | 'error';
  [k: string]: unknown;
}

const CATALOG_PATH = path.join(process.cwd(), 'data/gun-bill-catalog-20260828.json');
const POST_PATH = path.join(process.cwd(), 'data/enacted-dates-post2016.json');
const PRE_PATH = path.join(process.cwd(), 'data/enacted-dates-pre2016.json');

function validDate(d: string, minYear: number, maxYear: number): boolean {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(d);
  if (!m) return false;
  const mo = Number(m[1]);
  const da = Number(m[2]);
  const yr = Number(m[3]);
  if (mo < 1 || mo > 12 || da < 1 || da > 31) return false;
  if (yr < minYear || yr > maxYear) return false;
  const dt = new Date(yr, mo - 1, da);
  return dt.getMonth() === mo - 1 && dt.getDate() === da;
}

function normalize(d: string): string {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(d);
  if (!m) return d;
  return `${m[1].padStart(2, '0')}/${m[2].padStart(2, '0')}/${m[3]}`;
}

function main() {
  const dryRun = process.argv.includes('--dry-run');

  const post: DateRecord[] = JSON.parse(fs.readFileSync(POST_PATH, 'utf-8'));
  const pre: DateRecord[] = JSON.parse(fs.readFileSync(PRE_PATH, 'utf-8'));
  const catalog: GunBillCatalogYear[] = JSON.parse(
    fs.readFileSync(CATALOG_PATH, 'utf-8')
  );

  const cache = loadBillTextCache();
  const applied: string[] = [];
  const invalid: string[] = [];
  const unmatched: string[] = [];
  const notOk: string[] = [];

  const apply = (rec: DateRecord, minYear: number, maxYear: number) => {
    if (rec.status !== 'ok' || !rec.date) {
      notOk.push(`${rec.year}/${rec.bill} (${rec.status})`);
      return;
    }
    const d = normalize(rec.date);
    if (!validDate(d, minYear, maxYear)) {
      invalid.push(`${rec.year}/${rec.bill} -> ${d}`);
      return;
    }
    const group = catalog.find((y) => y.year === rec.year);
    const bill = group?.bills.find((b) => b.billNumber === rec.bill);
    if (!bill) {
      unmatched.push(`${rec.year}/${rec.bill}`);
      return;
    }
    if (bill.status !== 'Signed into Law') {
      unmatched.push(`${rec.year}/${rec.bill} (status: ${bill.status})`);
      return;
    }
    bill.enactmentDate = d;
    applied.push(`${rec.year}/${rec.bill} -> ${d}`);
    // Cache under the bill's URL so regeneration can restore it.
    const url: string | undefined = bill.officialUrl || bill.crsUrl;
    if (url && !url.includes('%20')) {
      let entry: Record<string, string> = {};
      const raw = cache.get(url);
      if (raw) {
        try {
          entry = JSON.parse(raw);
        } catch {
          entry = {};
        }
      }
      entry.enactedDate = d;
      if (!dryRun) cache.set(url, JSON.stringify(entry));
    }
  };

  for (const rec of post) apply(rec, 2016, 2026);
  for (const rec of pre) apply(rec, 1998, 2015);

  console.log(`Applied: ${applied.length}`);
  applied.forEach((a) => console.log(`  ${a}`));
  if (invalid.length) {
    console.log(`INVALID dates (rejected): ${invalid.length}`);
    invalid.forEach((a) => console.log(`  ${a}`));
  }
  if (unmatched.length) {
    console.log(`Unmatched / wrong status: ${unmatched.length}`);
    unmatched.forEach((a) => console.log(`  ${a}`));
  }
  if (notOk.length) {
    console.log(`Not ok (missing/error in extraction): ${notOk.length}`);
    notOk.forEach((a) => console.log(`  ${a}`));
  }

  if (dryRun) {
    console.log('\n[dry-run] catalog and cache NOT written.');
    return;
  }

  fs.writeFileSync(CATALOG_PATH, JSON.stringify(catalog, null, 2) + '\n');
  saveBillTextCache(cache);
  console.log('\nCatalog written:', CATALOG_PATH);
  console.log('Cache updated with enactedDate per URL (preserving other fields).');
}

main();

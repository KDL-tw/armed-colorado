/**
 * Validate and apply new factual bill summaries to the catalog (and the
 * per-URL cache, so catalog regeneration preserves them).
 *
 * Hard bans (reject the summary): bill-number references, the bill title
 * verbatim, template/stance/status artifacts ("Second Amendment", "2A
 * perspective", "firearm freedoms", "is a support/oppose/amend", "signed
 * into law", "is currently", "status of"), wrong sentence count (3-4 for
 * every bill — pre-2016 now has bill text available, so it matches the
 * post-2016 3-4 sentence size), empty/too-long text.
 * Soft warnings (applied but printed): stance/status-adjacent words that
 * could be legitimate ("supports", "passed", "enacted", ...).
 *
 * Input: a JSON file of [{ billNumber, summary }, ...]
 *
 * Usage: npx tsx scripts/apply-bill-summaries.ts <file.json> [--dry-run]
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  loadBillTextCache,
  saveBillTextCache,
} from '../src/lib/gun-bill/bill-text-cache';

interface YearGroup {
  year: number;
  bills: {
    billNumber: string;
    officialUrl: string;
    title: string;
    summary: string;
  }[];
}

interface Patch {
  billNumber: string;
  summary: string;
  /** Optional: when a billNumber is duplicated across year groups (RMGO
   * mis-listings, e.g. HB19-1022 exists as both a 2019 and a 2013 entry),
   * pass the year group to update only that copy. Omitted: all copies. */
  year?: number;
}

const HARD_BANS: [RegExp, string][] = [
  [/(hb|sb|r)\d{2}-\d+/i, 'bill number reference'],
  [/second amendment/i, 'Second Amendment opinion'],
  [/2a perspective/i, '2A opinion'],
  [/firearm freedoms/i, 'opinion phrase'],
  [/is a (support|oppose|amend)/i, 'position language'],
  [/(support|oppose|amend) bill/i, 'position language'],
  [/signed into law/i, 'status'],
  [/is currently/i, 'status'],
  [/status of/i, 'status'],
  [/currently dead/i, 'status'],
];

const SOFT_WARN: RegExp[] = [
  /\b(supports?|opposes?|amend\w*)\b/i,
  /\b(dead|passed|enacted|vetoed)\b/i,
  /\bfrom a\b/i,
];

function sentenceCount(text: string): number {
  return text
    .replace(/\d[.]\d/g, '0') // decimal points are not sentence ends
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0).length;
}

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function main() {
  const file = process.argv[2];
  const dryRun = process.argv.includes('--dry-run');
  if (!file || !fs.existsSync(file)) {
    console.error('Usage: npx tsx scripts/apply-bill-summaries.ts <file.json> [--dry-run]');
    process.exit(1);
  }

  const patches: Patch[] = JSON.parse(fs.readFileSync(file, 'utf-8'));
  const catalogPath = path.join(process.cwd(), 'data/gun-bill-catalog-20260828.json');
  const catalog: YearGroup[] = JSON.parse(fs.readFileSync(catalogPath, 'utf-8'));
  const cache = loadBillTextCache();

  const byNumber = new Map<string, { bill: YearGroup['bills'][0]; year: number }[]>();
  for (const y of catalog) {
    for (const b of y.bills) {
      const list = byNumber.get(b.billNumber) ?? [];
      list.push({ bill: b, year: y.year });
      byNumber.set(b.billNumber, list);
    }
  }

  let applied = 0;
  const rejected: string[] = [];
  const warned: string[] = [];
  const cacheUpdates = new Map<string, string>();

  for (const p of patches) {
    const hits = byNumber.get(p.billNumber) ?? [];
    if (hits.length === 0) {
      rejected.push(`${p.billNumber}: NOT FOUND in catalog`);
      continue;
    }
    const targets = p.year != null ? hits.filter((h) => h.year === p.year) : hits;
    if (targets.length === 0) {
      rejected.push(`${p.billNumber} (year ${p.year}): NOT FOUND in catalog`);
      continue;
    }
    // Sentence-count rule from the target copy's year group (or, when no
    // year is specified, the most recent group the bill appears in).
    const year = p.year ?? Math.max(...hits.map((h) => h.year));
    const isLive = year >= 2016 && year <= 2026;
    const s = (p.summary || '').trim();
    const problems: string[] = [];

    if (s.length < 30 || s.length > 1200) problems.push(`length ${s.length} outside 30-1200`);
    const sc = sentenceCount(s);
    if (isLive && (sc < 3 || sc > 4)) problems.push(`${sc} sentences (live bills need 3-4)`);
    if (!isLive && (sc < 3 || sc > 4)) problems.push(`${sc} sentences (pre-2016 needs 3-4, matching post-2016)`);
    for (const [re, why] of HARD_BANS) {
      if (re.test(s)) problems.push(`banned pattern (${why})`);
    }
    const titleNorm = normalize(targets[0].bill.title || '');
    if (titleNorm.length > 15 && normalize(s).includes(titleNorm)) {
      problems.push('contains the bill title verbatim');
    }

    if (problems.length > 0) {
      rejected.push(`${p.billNumber}: ${problems.join('; ')}`);
      continue;
    }

    for (const re of SOFT_WARN) {
      if (re.test(s)) {
        warned.push(`${p.billNumber}: soft match '${re.source}' -> "${s.slice(0, 90)}..."`);
        break;
      }
    }

    for (const { bill } of targets) {
      bill.summary = s;
      applied++;
      if (bill.officialUrl && bill.officialUrl.startsWith('https://leg.colorado.gov/bills/')) {
        const raw = cache.get(bill.officialUrl);
        let entry: Record<string, string> = {};
        if (raw) {
          try { entry = JSON.parse(raw); } catch { entry = {}; }
        }
        entry.summary = s;
        cacheUpdates.set(bill.officialUrl, JSON.stringify(entry));
      }
    }
  }

  console.log(`Applied: ${applied}/${patches.length}`);
  if (warned.length) {
    console.log('\nSoft warnings (applied — review):');
    console.log(warned.map((w) => `  ${w}`).join('\n'));
  }
  if (rejected.length) {
    console.log('\nREJECTED:');
    console.log(rejected.map((r) => `  ${r}`).join('\n'));
  }

  if (dryRun) {
    console.log('\n[dry-run] catalog and cache NOT written.');
    return;
  }
  if (applied === 0) {
    console.log('\nNothing applied — no writes.');
    return;
  }

  for (const [url, val] of cacheUpdates) cache.set(url, val);
  fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2) + '\n');
  saveBillTextCache(cache);
  console.log(`\nCatalog + cache written (${cacheUpdates.size} cache entries updated).`);
}

main();

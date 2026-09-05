/**
 * Filter each bill's sponsorLinks down to PRIME sponsors only.
 *
 * The RMGO `sponsors` field holds exactly the prime sponsors (verified
 * 2026-09-04: HB26-1126 → Sirota/Woodrow/Kipp, the three prime sponsors on
 * the CO GA bill page). The CO GA sponsorLinks arrays (populated by the
 * sponsor-hyperlinks feature) contain ALL sponsors — prime, sponsor, and
 * co-sponsor. This script keeps only the entries whose surname matches a
 * prime sponsor, preserving the RMGO name and resolving the slug from the
 * existing links. No network, no regeneration — a local transformation of
 * the catalog, so the title/summary/sponsorLinks preservation invariant is
 * respected (nothing but sponsorLinks is touched, and only by filtering).
 *
 * Usage: npx tsx scripts/filter-prime-sponsors.ts [--dry-run]
 */

import * as fs from 'fs';
import * as path from 'path';
import { splitSponsorString, parseSponsorToken, type SponsorLink } from '../src/lib/gun-bill/sponsor-links';

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

function primeTokens(bill: Bill): string[] {
  // `sponsors` may be a string, an array of tokens, or an array whose
  // elements are themselves comma-joined multi-name strings (observed on
  // pre-2026 bills, e.g. ["Rep. M. Duran, Rep. M. Gray, Sen. S. J. Lewis"]).
  const raw = Array.isArray(bill.sponsors) ? bill.sponsors : [bill.sponsors ?? ''];
  return raw.flatMap((t) => splitSponsorString(String(t)));
}

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) {
      cur[j] = Math.min(
        prev[j] + 1,
        cur[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
    prev = cur;
  }
  return prev[n];
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/** Surname of a display name: last non-initial word ("Rep. E. Sirota" -> "Sirota"). */
function surnameOf(name: string): string {
  const words = (name ?? '').split(/\s+/).filter((w) => !/^[A-Za-z]\.$/.test(w));
  return words[words.length - 1] ?? '';
}

/**
 * Match a prime sponsor surname against a link name. RMGO spellings can
 * differ from CO GA (Sonnenburg/Sonnenberg, Petterson/Pettersen, Sais/Sias,
 * Jennet/Jenet), so allow a small edit distance in addition to containment.
 */
function surnameMatch(primeSurname: string, linkName: string): boolean {
  const ps = normalize(primeSurname);
  const ls = normalize(surnameOf(linkName));
  if (!ps || !ls) return false;
  if (ls.includes(ps)) return true;
  const tol = ps.length >= 5 ? 2 : 1;
  return levenshtein(ps, ls) <= tol;
}

function filterBill(bill: Bill): { changed: boolean; before: number; after: number } {
  const links = bill.sponsorLinks ?? [];
  const before = links.length;
  const primes = primeTokens(bill);

  if (links.length === 0) return { changed: false, before, after: before };
  if (primes.length === 0) return { changed: false, before, after: before };

  const filtered: SponsorLink[] = [];
  const seenSlugs = new Set<string>();

  for (const token of primes) {
    const { surname } = parseSponsorToken(token);
    if (!surname) continue;

    const candidates = links.filter((l) => surnameMatch(surname, l.name ?? ''));
    const withSlug = candidates.find((l) => l.slug);
    const chosen = withSlug ?? candidates[0];

    if (chosen?.slug && !seenSlugs.has(chosen.slug)) {
      seenSlugs.add(chosen.slug);
      filtered.push({ name: token, slug: chosen.slug });
    } else if (chosen && !chosen.slug) {
      filtered.push({ name: token, slug: null });
    } else if (chosen?.slug && seenSlugs.has(chosen.slug)) {
      // Same slug already used by an earlier prime — likely a fuzzy
      // mis-match; keep the name unlinked rather than double-linking.
      filtered.push({ name: token, slug: null });
    } else {
      filtered.push({ name: token, slug: null });
    }
  }

  const changed = JSON.stringify(filtered) !== JSON.stringify(links);
  if (changed) bill.sponsorLinks = filtered;
  return { changed, before, after: filtered.length };
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

function main() {
  const dryRun = process.argv.includes('--dry-run');
  const catalogPath = path.join(process.cwd(), 'data/gun-bill-catalog-20260828.json');
  const catalog: YearGroup[] = JSON.parse(fs.readFileSync(catalogPath, 'utf-8'));

  const before = slugStats(catalog);
  let billsChanged = 0;
  let billsUntouchedNoLinks = 0;
  let billsUntouchedNoPrimes = 0;
  const sampleChanges: string[] = [];

  for (const y of catalog) {
    for (const bill of y.bills) {
      const links = bill.sponsorLinks ?? [];
      const primes = primeTokens(bill);
      if (links.length === 0) {
        billsUntouchedNoLinks++;
        continue;
      }
      if (primes.length === 0) {
        billsUntouchedNoPrimes++;
        continue;
      }
      const r = filterBill(bill);
      if (r.changed) {
        billsChanged++;
        if (sampleChanges.length < 5) {
          sampleChanges.push(
            `  ${bill.billNumber}: ${r.before} -> ${r.after} links (${primes.length} primes)`
          );
        }
      }
    }
  }

  const after = slugStats(catalog);
  const rows = catalog.reduce((n, y) => n + y.bills.length, 0);

  console.log(`Bills: ${rows}`);
  console.log(`Bills changed: ${billsChanged}`);
  console.log(`Bills untouched (no sponsorLinks): ${billsUntouchedNoLinks}`);
  console.log(`Bills untouched (no prime list): ${billsUntouchedNoPrimes}`);
  console.log(`bills_with_live_slugs: ${before.bills} -> ${after.bills}`);
  console.log(`total_live_slugs: ${before.slugs} -> ${after.slugs}`);
  console.log('Sample changes:');
  console.log(sampleChanges.join('\n'));

  if (dryRun) {
    console.log('\n[dry-run] catalog NOT written.');
    return;
  }

  fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2) + '\n');
  console.log('\nCatalog written:', catalogPath);
  console.log('Intentional aggregate change — update .cache/regression-baselines.json:');
  console.log(
    JSON.stringify({ bills_with_live_slugs: after.bills, total_live_slugs: after.slugs, total_bills: rows })
  );
}

main();

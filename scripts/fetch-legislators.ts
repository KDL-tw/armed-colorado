/**
 * Fetch CO GA legislator directory and resolve sponsor slugs for all live bills.
 *
 * Usage: npx tsx scripts/fetch-legislators.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { splitSponsorString } from '../src/lib/gun-bill/sponsor-links';
import type { GunBillCatalogYear } from '../src/lib/gun-bill/types';

const CATALOG_FILE = path.join(
  process.cwd(),
  'data/gun-bill-catalog-20260828.json'
);

const LEGISLATOR_DIR_URL = 'https://leg.colorado.gov/legislators';

interface Legislator {
  slug: string;
  name: string;
}

interface SponsorLink {
  name: string;
  slug: string | null;
}

async function fetchLegislators(): Promise<Record<string, Legislator>> {
  console.log(`Fetching legislator directory from ${LEGISLATOR_DIR_URL}...`);
  const res = await fetch(LEGISLATOR_DIR_URL, {
    redirect: 'follow',
    headers: { 'User-Agent': 'ArmedColorado-BillCatalog/1.0' },
  });
  if (!res.ok) {
    console.error(`HTTP ${res.status} fetching legislators`);
    throw new Error(`Failed to fetch legislator directory: ${res.status}`);
  }
  const html = await res.text();

  const legislators: Record<string, Legislator> = {};

  // Split by <tr> tags and parse each row
  const rows = html.split(/<\/tr>/gi);
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i].trim();
    if (!row || !row.includes('/legislators/')) continue;
    
    const slugMatch = row.match(/href=["']\/legislators\/([^"']+)["']/);
    if (!slugMatch) continue;
    
    const slug = slugMatch[1];
    const nameMatch = row.match(/<a[^>]*>(.*?)<\/a>/);
    const displayName = nameMatch ? nameMatch[1].trim() : slug;
    
    legislators[slug] = { slug, name: displayName };
  }

  console.log(`Found ${Object.keys(legislators).length} legislators`);
  return legislators;
}

async function main() {
  const legislators = await fetchLegislators();

  const catalog = JSON.parse(
    fs.readFileSync(CATALOG_FILE, 'utf8')
  ) as GunBillCatalogYear[];

  let processed = 0;
  let linked = 0;
  let plain = 0;

  for (const year of catalog) {
    for (const bill of year.bills) {
      const hasLiveUrl =
        !!bill.officialUrl && bill.officialUrl.includes('leg.colorado.gov/bills/');

      if (hasLiveUrl) {
        const links = resolveSponsorsToLegislators(bill.sponsors, legislators);
        bill.sponsorLinks = links;
        processed++;

        const ok = links.filter((l: SponsorLink) => l.slug).length;
        linked += ok;
        plain += links.length - ok;
        process.stdout.write(`  ${bill.billNumber}: ${ok}/${links.length} linked\n`);
      } else {
        bill.sponsorLinks = bill.sponsors
          .flatMap(splitSponsorString)
          .map((name: string) => ({ name, slug: null } as SponsorLink));
      }
    }
  }

  fs.writeFileSync(CATALOG_FILE, JSON.stringify(catalog, null, 2), 'utf8');
  console.log(
    `\nDone. ${processed} live-URL bills processed. ` +
      `${linked} sponsor links resolved, ${plain} plain-text.`
  );
}

function resolveSponsorsToLegislators(
  catalogSponsors: string[],
  legislators: Record<string, Legislator>
): SponsorLink[] {
  const resolvedLinks: SponsorLink[] = [];

  for (const rawToken of catalogSponsors) {
    const tokens = splitSponsorString(rawToken);

    for (const token of tokens) {
      const slugMatch = Object.entries(legislators).find(
        ([, l]) => l.name.toLowerCase() === token.toLowerCase()
      );

      if (slugMatch) {
        resolvedLinks.push({ name: token, slug: slugMatch[0] });
        continue;
      }

      const parsed = parseSponsorSurname(token);
      if (!parsed.surname) {
        resolvedLinks.push({ name: token, slug: null });
        continue;
      }

      // Find all legislators with matching surname (case-insensitive)
      const allMatches = Object.entries(legislators).map(([slug, l]) => {
        const match = l.name.toLowerCase().includes(parsed.surname.toLowerCase());
        return { slug, name: l.name, match };
      });

      // Filter to exact single match
      const matches = allMatches.filter(({ match }) => match);

      if (matches.length === 1) {
        resolvedLinks.push({ name: token, slug: matches[0].slug });
      } else if (matches.length > 1) {
        resolvedLinks.push({ name: token, slug: null });
      } else {
        resolvedLinks.push({ name: token, slug: null });
      }
    }
  }

  return resolvedLinks;
}

function parseSponsorSurname(token: string): { chamber: 'House' | 'Senate' | null; surname: string } {
  const lowerToken = token.toLowerCase();
  let chamber: 'House' | 'Senate' | null = null;

  if (/senate|sen\./i.test(lowerToken)) {
    chamber = 'Senate';
  } else if (/house|rep\./i.test(lowerToken)) {
    chamber = 'House';
  }

  const stripped = token
    .replace(/^(Rep|Senator|Representative|Sen|Rep)\.?\s*/i, '')
    .trim();

  const words = stripped.split(/\s+/);
  const lastWord = words[words.length - 1];
  const isInitial = /^[A-Z]\.$/.test(lastWord);

  let surname: string;
  if (isInitial && words.length >= 2) {
    surname = words[words.length - 2];
  } else {
    surname = lastWord;
  }

  return { chamber, surname };
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

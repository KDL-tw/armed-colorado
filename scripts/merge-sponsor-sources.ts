/**
 * Merge sponsor resolution from two sources:
 * 1. Bill-page anchors (covers former legislators)
 * 2. Legislator directory matching (covers name-format gaps like Hartsook/Boesenecker)
 *
 * Usage: npx tsx scripts/merge-sponsor-sources.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { splitSponsorString, type SponsorLink } from '../src/lib/gun-bill/sponsor-links';

interface YearGroup {
  year: number;
  bills: Bill[];
}

interface Bill {
  billNumber: string;
  officialUrl: string;
  sponsors: string;
  sponsorLinks?: SponsorLink[];
}

interface LegislatorsDict {
  [slug: string]: {
    name: string;
    chamber: 'House' | 'Senate';
  };
}

async function main() {
  const catalogPath = path.join(process.cwd(), 'data/gun-bill-catalog-20260828.json');
  const legislatorsPath = path.join(process.cwd(), '.cache/legislators/legislators.json');
  
  // Read catalog
  console.log('Reading catalog...');
  const catalogContent = fs.readFileSync(catalogPath, 'utf-8');
  const catalog: YearGroup[] = JSON.parse(catalogContent);
  
  // Fetch legislator directory
  console.log('Fetching legislator directory...');
  const legislators = await fetchLegislators();
  
  // Resolve each bill's sponsors using BOTH sources
  let totalBills = 0;
  let totalLiveSlugs = 0;
  let totalAnchors = 0;
  
  for (const yearGroup of catalog) {
    for (const bill of yearGroup.bills) {
      totalBills++;
      
      // Start with bill-page anchors (covers former legislators)
      let resolvedLinks: SponsorLink[] = [];
      
      // Source 1: Bill-page anchors (if available)
      console.log(`  ${bill.billNumber}: officialUrl=${bill.officialUrl}`);
      if (bill.officialUrl && bill.officialUrl.includes('leg.colorado.gov/bills/')) {
        try {
          const anchors = await extractBillSponsorAnchors(bill.officialUrl);
          if (anchors.length > 0) {
            console.log(`  ${bill.billNumber}: Found ${anchors.length} bill-page anchors`);
            resolvedLinks = anchors.map(anchor => ({ name: anchor.name, slug: anchor.slug.startsWith('/') ? anchor.slug.slice(1) : anchor.slug }));
          }
        } catch (err) {
          console.error(`  ${bill.billNumber}: Failed to extract bill-page anchors: ${err}`);
        }
      }
      
      // Source 2: Legislator directory matching (fills gaps like Hartsook/Boesenecker)
      const sponsorsStr = Array.isArray(bill.sponsors) ? bill.sponsors.join(', ') : bill.sponsors;
      const tokens = sponsorsStr ? splitSponsorString(sponsorsStr).filter((t): t is string => t !== undefined && t !== null && t.trim() !== '') : [];
      for (const token of tokens) {
        const existingLink = resolvedLinks.find(l => l.name === token);
        if (existingLink?.slug) continue; // Already resolved
        
        // Try to find matching legislator
        const legislator = findLegislatorByName(token, legislators);
        if (legislator) {
          console.log(`  ${bill.billNumber}: Resolved "${token}" → ${legislator.slug}`);
          resolvedLinks.push({ name: token, slug: legislator.slug });
        } else {
          resolvedLinks.push({ name: token, slug: null });
        }
      }
      
      // Merge: prefer bill-page anchors, fill missing with directory matches
      bill.sponsorLinks = resolvedLinks;
      
      // Count live slugs
      const liveSlugs = resolvedLinks.filter(l => l.slug).length;
      const liveAnchors = resolvedLinks.filter(l => l.slug).length;
      totalLiveSlugs += liveSlugs;
      totalAnchors += liveAnchors;
      
      if (liveSlugs > 0) {
        console.log(`  ${bill.billNumber}: ${liveSlugs}/${tokens.length} live slugs`);
      }
    }
  }
  
  console.log(`\nDone. ${totalBills} bills processed. ${totalLiveSlugs} live slugs, ${totalAnchors} page anchors.`);
  
  // Write updated catalog
  console.log('Writing catalog...');
  fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2));
  
  // Write legislators cache
  const legislatorsCachePath = path.join(process.cwd(), '.cache/legislators/legislators.json');
  fs.mkdirSync(path.dirname(legislatorsCachePath), { recursive: true });
  fs.writeFileSync(legislatorsCachePath, JSON.stringify(legislators, null, 2));
  
  console.log('Done. Catalog and legislators cache updated.');
}

async function fetchLegislators(): Promise<LegislatorsDict> {
  const result = await fetch('https://leg.colorado.gov/legislators');
  const html = await result.text();
  
  // Extract all /legislators/{slug} links
  const slugRegex = /<a[^>]*href=["']\/legislators\/([^"'\s>]+)["'][^>]*>(.*?)<\/a>/gi;
  const legislators: LegislatorsDict = {};
  
  let match;
  while ((match = slugRegex.exec(html)) !== null) {
    const slug = match[1].startsWith('/') ? match[1].slice(1) : match[1];
    const displayName = match[2]?.trim() || slug;
    const lowerText = displayName.toLowerCase();
    
    // Infer chamber from text
    let chamber: 'House' | 'Senate';
    if (/(?:senate|sen\.)/.test(lowerText)) {
      chamber = 'Senate';
    } else if (/(?:house|rep\.)/.test(lowerText)) {
      chamber = 'House';
    } else {
      // Fallback: infer from slug (contains "house" for House members)
      chamber = slug.includes('house') ? 'House' : 'Senate';
    }
    
    legislators[slug] = { name: displayName, chamber };
  }
  
  console.log(`Found ${Object.keys(legislators).length} legislators`);
  return legislators;
}

async function extractBillSponsorAnchors(billUrl: string): Promise<Array<{ name: string; slug: string }>> {
  const result = await fetch(billUrl);
  const html = await result.text();
  
  console.log(`  Debug: Extracting anchors from ${billUrl}`);
  
  // Match both absolute and relative hrefs
  const slugRegex = /<a[^>]*href=["'](\/legislators\/[^"'\s>]+)["'][^>]*>/gi;
  const anchors = new Map<string, string>();
  
  let match;
  let count = 0;
  while ((match = slugRegex.exec(html)) !== null) {
    const slug = match[1];
    // Try to extract anchor text (before </a>)
    const textMatch = /<a[^>]*href=["']\/legislators\/[^"'\s>]+["'][^>]*>([^<]*)<\/a>/.exec(html.substring(match.index));
    const name = textMatch ? textMatch[1]?.trim() : slug;
    anchors.set(name, slug);
    count++;
  }
  
  console.log(`  Debug: Found ${count} anchors`);
  return Array.from(anchors.entries()).map(([name, slug]) => ({ name, slug: slug.startsWith('/') ? slug.slice(1) : slug }));
}

function findLegislatorByName(token: string, legislators: LegislatorsDict): { slug: string; name: string } | null {
  const tokens = token.toLowerCase().split(/\s+/).filter(Boolean);
  
  // Try exact match first (case-insensitive)
  const exactMatch = Object.entries(legislators).find(
    ([slug, l]) => l.name.toLowerCase() === token.toLowerCase()
  );
  
  if (exactMatch) {
    return { slug: exactMatch[0], name: exactMatch[1].name };
  }
  
  // Try partial match (surname only)
  const parsed = splitSponsorSurname(token);
  if (!parsed.surname) {
    return null;
  }
  
  // Find legislators with matching surname
  const matches = Object.entries(legislators).filter(
    ([slug, l]) =>
      l.name.toLowerCase().includes(parsed.surname.toLowerCase()) &&
      (parsed.chamber === null || l.chamber === parsed.chamber)
  );
  
  if (matches.length === 1) {
    return { slug: matches[0][0], name: matches[0][1].name };
  }
  
  return null;
}

function splitSponsorSurname(name: string): { surname: string; chamber: 'House' | 'Senate' | null } {
  const lowerName = name.toLowerCase();
  let chamber: 'House' | 'Senate' | null = null;
  
  if (/(?:senate|sen\.)/.test(lowerName)) {
    chamber = 'Senate';
  } else if (/(?:house|rep\.)/.test(lowerName)) {
    chamber = 'House';
  }
  
  // Try to extract surname (last word)
  const parts = name.trim().split(/\s+/);
  const surname = parts[parts.length - 1];
  
  return { surname, chamber };
}

main().catch(console.error);

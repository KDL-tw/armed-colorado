/**
 * Pure functions for splitting, parsing, extracting, and resolving sponsor links.
 * Used by `scrape-rmgo.ts` to match RMGO sponsors against CO GA bill page sponsors.
 */

export type Chamber = 'House' | 'Senate';

export interface PageSponsor {
  chamber: Chamber;
  surname: string;
  displayName: string;
  slug: string;
}

export type SponsorLink = {
  name: string;
  slug: string | null;
};

/**
 * Split a raw sponsor string into individual tokens.
 * Normalizes separators and trims whitespace.
 *
 * @param raw - Raw sponsor string from RMGO (e.g., "Rep. John Doe, Sen. Jane Smith")
 * @returns Array of non-empty, trimmed tokens
 */
export function splitSponsorString(raw: string): string[] {
  if (!raw) return [];
  
  // Normalize separators: & → comma, / → comma, ' and ' → comma
  const normalized = raw
    .replace(/&/g, ',')
    .replace(/\//g, ',')
    .replace(/ and /gi, ',');

  // Split on commas and filter empty strings
  return normalized
    .split(',')
    .map(token => token.trim())
    .filter(token => token.length > 0);
}

/**
 * Parse a sponsor token into chamber and surname.
 * Handles various prefix formats (Rep., Sen., Representative, Senator).
 *
 * @param token - Sponsor token from splitSponsorString (e.g., "Rep. John Doe")
 * @returns Object with chamber and surname
 */
export function parseSponsorToken(token: string): { chamber: Chamber | null; surname: string } {
  // Determine chamber from original token (before stripping)
  const lowerToken = token.toLowerCase();
  let chamber: Chamber | null = null;

  if (/senate|sen\./i.test(lowerToken)) {
    chamber = 'Senate';
  } else if (/house|rep\.|representative|rep/i.test(lowerToken)) {
    chamber = 'House';
  }

  // Strip leading chamber prefixes
  const stripped = token
    .replace(/^(Rep\.|Senator|Representative|Sen\.|Rep)\.?/i, '')
    .trim();

  // Extract surname (last non-initial word)
  // An initial is a single letter followed by a period (e.g., "J.")
  // If the last word is an initial, use the second-to-last word as surname
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

/**
 * Extract sponsor links from a CO GA bill page HTML.
 * Parses only /legislators/{slug} anchors under the "Prime Sponsor" section
 * and deduplicates by slug.
 *
 * @param html - HTML content from CO GA bill page
 * @returns Array of PageSponsor objects (only prime sponsors)
 */
export function extractPageSponsors(html: string): PageSponsor[] {
  const primeSponsors: PageSponsor[] = [];

  // Find the "Sponsors" section and "Prime Sponsor" heading
  // Extract only links that appear under "Prime Sponsor" before next heading
  const sponsorsSectionRegex = /<h3[^>]*>Sponsors<\/h3>[\s\S]*?<h4[^>]*>Prime Sponsor<\/h4>[\s\S]*?(?=<h4[^>]*>Sponsor<\/h4>|<h4[^>]*>Co-Sponsor<\/h4>|<h3[^>]*>)/;
  const sponsorsMatch = html.match(sponsorsSectionRegex);

  if (!sponsorsMatch) {
    // Fallback: return empty array if Prime Sponsor section not found
    return [];
  }

  const primeSponsorSection = sponsorsMatch[0];

  // Extract all /legislators/{slug} anchors from the Prime Sponsor section
  const slugRegex = /<a[^>]*href=["']\/legislators\/([^"']+)["'][^>]*>(.*?)<\/a>/gi;
  let match;

  while ((match = slugRegex.exec(primeSponsorSection)) !== null) {
    const slug = match[1];
    const displayName = match[2]?.trim() || slug;
    const displayText = displayName.toLowerCase();
    // Extract surname from display name (format: "Last, First")
    const surname = displayName
      .split(/\s+/)
      .filter(w => !/^[A-Za-z]\.$/.test(w))
      .pop() || displayName;

    // Parse chamber from display text (Rep./Sen./Representative/Senator)
    let chamber: 'House' | 'Senate';
    if (/senate|sen\./i.test(displayText)) {
      chamber = 'Senate';
    } else if (/house|rep\.|representative|rep/i.test(displayText)) {
      chamber = 'House';
    } else {
      // Fallback: infer from slug pattern (e.g., "house-123" or "senate-456")
      if (slug.startsWith('house-')) {
        chamber = 'House';
      } else if (slug.startsWith('senate-')) {
        chamber = 'Senate';
      } else {
        chamber = 'House'; // Default to House
      }
    }

    primeSponsors.push({
      chamber,
      surname,
      displayName,
      slug,
    });
  }

  // Deduplicate by slug (keep first occurrence)
  const seenSlugs = new Set<string>();
  const uniqueSponsors: PageSponsor[] = [];
  for (const sponsor of primeSponsors) {
    if (!seenSlugs.has(sponsor.slug)) {
      seenSlugs.add(sponsor.slug);
      uniqueSponsors.push(sponsor);
    }
  }

  return uniqueSponsors;
}

/**
 * Resolve catalog sponsors to page sponsors.
 * Matches by chamber+surname or unique surname.
 *
 * @param catalogSponsors - Array of raw sponsor strings from RMGO catalog
 * @param pageSponsors - Array of PageSponsor objects from CO GA bill page
 * @returns Array of SponsorLink objects with resolved slugs
 */
export function resolveSponsorLinks(
  catalogSponsors: string[],
  pageSponsors: PageSponsor[]
): SponsorLink[] {
  const resolvedLinks: SponsorLink[] = [];

  // Parse each catalog sponsor token
  for (const rawToken of catalogSponsors) {
    const tokens = splitSponsorString(rawToken);

    for (const token of tokens) {
      const parsed = parseSponsorToken(token);
      const { chamber, surname } = parsed;

      // Find matching page sponsor (match by surname, not full name)
      const matches = pageSponsors.filter(
        p => {
          const pageSurname = p.displayName.split(/\s+/).pop() || p.displayName;
          return (pageSurname.toLowerCase() === surname.toLowerCase() || pageSurname === surname) &&
            (chamber === null || p.chamber === chamber);
        }
      );

      // Ambiguous same-name cases → slug = null
      if (matches.length > 1) {
        resolvedLinks.push({ name: token, slug: null });
        continue;
      }

      // Unmatched → slug = null
      if (matches.length === 0) {
        resolvedLinks.push({ name: token, slug: null });
        continue;
      }

      // Unique match → resolved
      const match = matches[0];
      resolvedLinks.push({ name: token, slug: match.slug });
    }
  }

  return resolvedLinks;
}

/**
 * Fetch a CO GA bill page and resolve the catalog's sponsor tokens to
 * profile links. On any failure (network, HTTP error, parse) it degrades
 * to plain-text links (slug = null) so a bill row is never lost.
 */
export async function extractCoGaSponsorLinks(
  billUrl: string,
  catalogSponsors: string[]
): Promise<SponsorLink[]> {
  const fallback = (): SponsorLink[] =>
    catalogSponsors.map((name) => ({ name, slug: null }));
  try {
    const res = await fetch(billUrl, {
      redirect: "follow",
      headers: { "User-Agent": "ArmedColorado-BillCatalog/1.0" },
    });
    if (!res.ok) {
      console.error(`HTTP ${res.status} fetching sponsors from ${billUrl}`);
      return fallback();
    }
    const html = await res.text();
    return resolveSponsorLinks(catalogSponsors, extractPageSponsors(html));
  } catch (error) {
    console.error(`Error extracting sponsor links from ${billUrl}:`, error);
    return fallback();
  }
}

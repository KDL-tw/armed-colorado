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
 * Parses only /legislators/{slug} anchors under the "Prime Sponsors" section
 * and deduplicates by slug.
 *
 * Verified structure (2026-09-04, live curl of HB26-1126): the page top has
 * <h2>Prime Sponsors</h2> followed directly by prime sponsor tiles. Each tile
 * is an /legislators/{slug} anchor whose inner HTML holds the chamber in a
 * preceding <p> (e.g. "Representative") and the display name in
 * <p class='prime-sponsor-name'>. The all-sponsors area (Prime Sponsor /
 * Sponsor / Co-Sponsor category labels) sits much further down the page.
 *
 * @param html - HTML content from CO GA bill page
 * @returns Array of PageSponsor objects (only prime sponsors)
 */
export function extractPageSponsors(html: string): PageSponsor[] {
  const primeSponsors: PageSponsor[] = [];

  // Capture from <h2>Prime Sponsors</h2> up to the next <h2> (e.g.
  // Committees) or a sponsor-category <p>. The prime tiles sit directly
  // under this heading, so the capture contains exactly the prime anchors.
  const primeSponsorRegex = /<h2[^>]*>Prime Sponsors<\/h2>([\s\S]*?)(?=(<h2|<p>\s*(?:Prime Sponsor|Sponsor|Co-Sponsor)\s*<\/p>|$))/;
  const primeSponsorMatch = html.match(primeSponsorRegex);

  if (!primeSponsorMatch) {
    // Fallback: return empty array if Prime Sponsor section not found
    return [];
  }

  const primeSponsorSection = primeSponsorMatch[1];

  // Extract all /legislators/{slug} anchors from the Prime Sponsor section.
  // Each anchor's inner HTML contains the chamber in a preceding <p>
  // ("Representative"/"Senator") and the name in <p class='prime-sponsor-name'>.
  const anchorRegex = /<a[^>]*href="\/legislators\/([^"]+)"[^>]*>([\s\S]*?)<\/a>/g;
  let match;

  while ((match = anchorRegex.exec(primeSponsorSection)) !== null) {
    const slug = match[1];
    const innerHtml = match[2];

    // Extract the name from <p class='prime-sponsor-name'> inside the anchor
    const nameMatch = innerHtml.match(/prime-sponsor-name'?>\s*([\s\S]*?)\s*</);
    if (!nameMatch) continue;
    const displayName = nameMatch[1].trim().replace(/\s+/g, ' ');

    // Chamber from the preceding <p> (Representative/Senator) inside the tile.
    // NB: prefix test — "Representative" contains the substring "sen".
    const chamberMatch = innerHtml.match(/<p>\s*(Representative|Senator|Rep\.|Sen\.)\s*<\/p>/i);
    const chamber: Chamber =
      chamberMatch && /^sen/i.test(chamberMatch[1].trim()) ? 'Senate' : 'House';

    // Surname: last non-initial word (handles "First Last" and "Last, First")
    const surname =
      displayName
        .split(/[\s,]+/)
        .filter((w) => w.length > 0 && !/^[A-Za-z]\.$/.test(w))
        .pop() || displayName;

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

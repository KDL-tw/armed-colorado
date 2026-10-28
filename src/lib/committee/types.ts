export interface CommitteeMember {
  slug: string; // leg.colorado.gov/legislators/<slug> — also the photo filename
  name: string; // display name — from the reference (source of truth)
  title: string; // "Representative" | "Senator" (from the live legislator page)
  role: string | null; // "Chair" | "Vice Chair" | null — from the reference, rendered on the card
  district: string; // "HD-26" | "SD-14" — from the live legislator page
  email: string; // from the reference (source of truth)
  phone: string; // from the reference (source of truth)
  photo: boolean; // whether data/committee-photos/<slug>.jpg exists
}

export interface Committee {
  chamber: "house" | "senate";
  slug: string; // URL slug, e.g. "Education"
  name: string; // display name — from the live H1 (decoded)
  url: string; // full committee page URL — from the live site
  description: string; // committee purpose — from the live site
  members: CommitteeMember[];
}

export interface CommitteeCatalog {
  session: string; // e.g. "2026A"
  fetchedAt: string; // ISO timestamp of the last successful fetch
  committees: Committee[];
}

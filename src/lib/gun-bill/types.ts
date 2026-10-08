// Position types from RMGO data
export type GunBillPosition = 'Support' | 'Oppose' | 'Amend' | 'Monitor';

// Status types from RMGO data
export type GunBillStatus =
  | 'Signed into Law'
  | 'Died in Committee'
  | 'Dead'
  | 'Signed by Governor'
  | 'Out of Session'
  | 'Passed House'
  | 'Passed Senate'
  | 'Held-over'
  | 'Law';

// A bill as it appears on RMGO billwatch page
export type RmgoBill = {
  position: GunBillPosition;
  billNumber: string;
  sponsors: string[];
  subject: string;
  subjectUrl?: string;
  location: string;
  status: GunBillStatus;
  enactmentDate?: string | null;
};

export type SponsorLink = {
  name: string;
  slug: string | null;
};

// Internal representation for the catalog
export type GunBillCatalogEntry = {
  billNumber: string;
  title: string;
  summary: string;
  position: GunBillPosition;
  status: GunBillStatus;
  sponsors: string[];
  sponsorLinks?: SponsorLink[];
  location?: string;
  enactmentDate?: string | null;
  officialUrl?: string;
  crsCitation?: string;
  crsUrl?: string;
  /** Provenance of `title`: "co-ga-official" = official long title from the
   *  CO GA bill page (cache field coGaLongTitle / researched authoritative
   *  source); "clics-archive" = official short title from the archived
   *  Colorado Legislature CLICS "Title and Sponsors" bill-range list page
   *  (pre-2016, no live CO GA page); "rmgo-subject" = RMGO's short subject
   *  (fallback). */
  titleSource?: "co-ga-official" | "clics-archive" | "rmgo-subject";
};

export type GunBillCatalogYear = {
  year: number;
  bills: GunBillCatalogEntry[];
};

export type GunBillCatalog = GunBillCatalogYear[];

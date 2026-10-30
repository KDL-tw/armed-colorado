/**
 * Types for the /concealed-carry page data (data/chp/*.json).
 * All content is committed data — see scripts/fetch-chp-*.ts for the
 * refresh pipeline and .github/workflows/chp-data.yml for the weekly PR.
 */

/** One CRS (or federal) statute cited on the page. */
export interface CrsStatute {
  /** Citation exactly as cited on the page, e.g. "18-12-203". */
  citation: string;
  /** Current official title (verified against statute text, Task 0.1). */
  title: string;
  /** 3-8 word description (the statute table row). */
  description: string;
  /** 2-4 sentence factual summary (Task 0.1). */
  summary: string;
  /** true for 18 USC entries (linked via Cornell LII, not CGA). */
  federal?: boolean;
  /** true for statutes that govern the page's topics but are NOT in the CBI CHP statute list (e.g. 18-12-106 brandishing, 18-1-704 duty to retreat). Rendered in a separate "Related statutes" subsection; excluded from the CBI reconciliation in scripts/fetch-chp-crs.ts. */
  related?: boolean;
}

/** One topic under "Concealed Handgun Carry Laws". */
export interface CrsTopic {
  id: string;
  heading: string;
  /** Statute citations summarized here (must exist in `statutes`). */
  citations: string[];
  /** 2-5 sentence summary written for this topic (Task 0.1). */
  summary: string;
}

/** One step in an obtain/renew infographic. */
export interface CrsStep {
  title: string;
  detail: string;
  citations: string[];
}

/** One FAQ entry. */
export interface CrsFaq {
  question: string;
  answer: string;
  citations: string[];
}

export interface CrsFees {
  newApplication: { total: number; parts: { label: string; amount: number }[]; citation: string };
  temporaryEmergency: { total: number; parts: { label: string; amount: number }[]; citation: string };
  renewal: { total: number; parts: { label: string; amount: number }[]; citation: string };
  /** Verbatim CBI fee-payment note. */
  paymentNote: string;
}

export interface CrsData {
  fetchedAt: string;
  sourceUrl: string;
  statutes: CrsStatute[];
  topics: CrsTopic[];
  obtain: { steps: CrsStep[]; exceptions: CrsStep[] };
  renew: { steps: CrsStep[]; exceptions: CrsStep[] };
  faqs: CrsFaq[];
  fees: CrsFees;
}

export type ReciprocityStatus = "full" | "partial" | "none";

export interface ReciprocityState {
  /** Official state name, matching us-atlas `properties.name` (e.g. "Colorado", "District of Columbia"). */
  name: string;
  status: ReciprocityStatus;
  /** For partial: what the discrepancy is. */
  note?: string;
}

export interface ReciprocityData {
  fetchedAt: string;
  sourceUrl: string;
  statuteCitation: string;
  /** Requirements list from the CBI page. */
  requirements: string[];
  states: ReciprocityState[];
}

export interface SheriffInfo {
  /** UPPERCASE county name, exactly matching data/districts county names (e.g. "EL PASO"). */
  county: string;
  /** Sheriff's name (OCV `jobtitle`). */
  sheriff: string;
  phone: string;
  fax: string | null;
  address: string;
  /** CHP-relevant email — null until researched (Risks §1). */
  chpEmail: string | null;
  /** Sheriff department webpage — null until researched. */
  website: string | null;
  /** CHP application URL — null until researched. */
  chpUrl: string | null;
  /** Hours of operation — null until researched. */
  hours: string | null;
}

export interface SheriffsData {
  fetchedAt: string;
  sourceUrl: string;
  sheriffs: SheriffInfo[];
}

/**
 * Types for the /sb25-003 page data (data/sb25/*.json).
 * All content is committed data — see scripts/fetch-sb25-*.ts for the
 * refresh pipeline. The /sb25-003 page is a server component.
 */

/** Category tag for a Specified Semiautomatic Firearm. */
export type SsfCategory = "rifle" | "shotgun" | "handgun";

export interface SsfFirearm {
  /** "MAKE - MODEL", line-wrapping already joined. */
  name: string;
  category: SsfCategory;
  /** true when the entry came from the PDF's ADDENDUM section. */
  inAddendum?: boolean;
}

export interface SsfData {
  fetchedAt: string;
  sourceUrl: string; // the guidance PDF URL
  version: string; // e.g. "07/30/2026" (from the filename/header)
  counts: { rifle: number; shotgun: number; handgun: number; total: number };
  firearms: SsfFirearm[];
}

/** A cost or time cell on the process graphic. `varies` lets us say
 *  "varies by county/instructor" instead of inventing a number. */
export interface CostOrTime {
  label: string;
  detail?: string;
}

export interface PermitStep {
  title: string;
  detail: string;
  cost: CostOrTime;
  time: CostOrTime;
  citations: string[]; // CRS citations → CrsLink
}

export interface CourseOption {
  id: "basic" | "extended";
  hours: number;
  title: string;
  requiredWhen: string;
  format: string;
  passScore: string;
  notes: string;
}

export interface FeeRow {
  label: string;
  amount: string; // "$52" / "varies by county" / …
  collectedBy: string;
  description: string;
}

export interface Sb25SourceLink {
  label: string;
  url: string;
}

export interface Sb25Process {
  fetchedAt: string;
  sourceUrls: string[];
  law: {
    effectiveDate: string;
    citations: string[];
    is: string[];
    isNot: string[];
  };
  permitSteps: PermitStep[];
  courseOptions: CourseOption[];
  courseRequirements: string[];
  fees: {
    rows: FeeRow[];
    paymentNote: string;
    totalExcludingFirearm: string;
  };
  totals: {
    optimisticTime: string;
    optimisticTimeNote: string;
  };
  links: { cpw: Sb25SourceLink[]; sbg: Sb25SourceLink[] };
  instructorProgram: {
    howToBecome: string;
    trainTheTrainer: string;
    upcoming: { date: string; time: string; mode: string }[];
    contact: { phone: string; email: string };
  };
}

export interface Sb25Instructor {
  name: string;
  organization?: string | null;
  county?: string | null;
  city?: string | null;
  phone?: string | null;
  email?: string | null;
  url?: string | null;
  course?: string | null;
  notes?: string | null;
}

export interface Sb25Instructors {
  fetchedAt: string;
  source: string;
  instructors: Sb25Instructor[];
}

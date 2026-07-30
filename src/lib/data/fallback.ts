export type TimelineItem = { date: string; label: string };
export type SourceLink = { label: string; url: string };

export type LitigationCase = {
  id?: string;
  slug: string;
  title: string;
  court: string | null;
  docket: string | null;
  parties: string | null;
  status: string;
  summary: string;
  timeline: TimelineItem[];
  sources: SourceLink[];
  updated_at?: string;
};

export type ResourceLink = {
  id?: string;
  slug: string;
  name: string;
  category: string;
  url: string | null;
  description: string;
  note: string | null;
  colorado_contact: boolean | null;
  sort_order: number;
};

export type FaqEntry = {
  id?: string;
  page_key: string;
  question: string;
  answer: string;
  sort_order: number;
};

export type EventItem = {
  id?: string;
  title: string;
  starts_at: string | null;
  location: string | null;
  url: string | null;
  description: string;
};

export type CcwOrg = {
  id?: string;
  name: string;
  url: string | null;
  region: string | null;
  phone: string | null;
  notes: string | null;
  sort_order: number;
};

export type CountyAvailability = {
  id?: string;
  county: string;
  status: string;
  provider_notes: string | null;
  class_url: string | null;
};

/** Offline fallbacks when Supabase is not configured */
export const FALLBACK_CASES: LitigationCase[] = [
  {
    slug: "garcia-v-polis",
    title: "Garcia v. Polis",
    court: "U.S. District Court for the District of Colorado",
    docket: null,
    parties:
      "Plaintiffs challenging Colorado firearm waiting-period / related restrictions; Jared Polis et al.",
    status: "active",
    summary:
      "Federal challenge related to Colorado firearm waiting-period rules. Verify latest docket entries before relying on status.",
    timeline: [{ date: "2024+", label: "Case active — verify latest docket" }],
    sources: [
      { label: "CourtListener", url: "https://www.courtlistener.com/" },
    ],
  },
  {
    slug: "del-toro-v-polis",
    title: "Del Toro v. Polis",
    court: "U.S. District Court for the District of Colorado",
    docket: "1:25-cv-02725",
    parties:
      "Del Toro et al. & Colorado State Shooting Association v. Polis et al.",
    status: "active",
    summary:
      "Federal challenge to SB25-003 on Second Amendment grounds. Plaintiffs include CSSA; Mountain States Legal Foundation is counsel.",
    timeline: [
      { date: "2025-09-02", label: "Complaint filed" },
      {
        date: "2026",
        label: "Motion practice ongoing — check Justia / PACER",
      },
    ],
    sources: [
      {
        label: "Justia docket",
        url: "https://dockets.justia.com/docket/colorado/codce/1:2025cv02725/246985",
      },
      {
        label: "SB25-003",
        url: "https://leg.colorado.gov/bills/sb25-003",
      },
    ],
  },
  {
    slug: "doj-v-denver",
    title: "DOJ v. Denver",
    court: "Federal court (Colorado)",
    docket: null,
    parties: "U.S. DOJ / City and County of Denver — verify caption",
    status: "monitoring",
    summary:
      "Tracker placeholder for DOJ matters involving Denver and firearms policy. Confirm docket before citing.",
    timeline: [
      { date: "n/a", label: "Awaiting confirmed docket — edit in admin" },
    ],
    sources: [{ label: "DOJ", url: "https://www.justice.gov/" }],
  },
  {
    slug: "doj-v-colorado",
    title: "DOJ v. Colorado",
    court: "Federal court (Colorado)",
    docket: null,
    parties: "U.S. DOJ / State of Colorado — verify caption",
    status: "monitoring",
    summary:
      "Tracker placeholder for DOJ matters involving Colorado and firearms policy. Confirm docket before citing.",
    timeline: [
      { date: "n/a", label: "Awaiting confirmed docket — edit in admin" },
    ],
    sources: [{ label: "DOJ", url: "https://www.justice.gov/" }],
  },
];

export const FALLBACK_RESOURCES: ResourceLink[] = [
  {
    slug: "cffla",
    name: "CFFLA",
    category: "advocacy",
    url: "https://www.cffla.org/",
    description: "Colorado firearms legislation and advocacy.",
    note: null,
    colorado_contact: true,
    sort_order: 10,
  },
  {
    slug: "rmgo",
    name: "Rocky Mountain Gun Owners",
    category: "advocacy",
    url: "https://rmgo.org/",
    description: "Colorado gun-rights advocacy.",
    note: null,
    colorado_contact: true,
    sort_order: 20,
  },
  {
    slug: "cssa",
    name: "Colorado State Shooting Association",
    category: "advocacy",
    url: "https://cssa.org/",
    description: "State shooting association; Del Toro plaintiff.",
    note: null,
    colorado_contact: true,
    sort_order: 30,
  },
  {
    slug: "nra",
    name: "NRA",
    category: "advocacy",
    url: "https://home.nra.org/",
    description: "National firearms advocacy and training.",
    note: null,
    colorado_contact: true,
    sort_order: 40,
  },
  {
    slug: "wfgr",
    name: "Women for Gun Rights",
    category: "advocacy",
    url: "https://womenforgunrights.com/",
    description: "Women and firearms rights advocacy.",
    note: null,
    colorado_contact: false,
    sort_order: 50,
  },
  {
    slug: "goa",
    name: "Gun Owners of America",
    category: "advocacy",
    url: "https://www.gunowners.org/",
    description: "National gun-rights organization.",
    note: "No dedicated Colorado state contact listed at publish time.",
    colorado_contact: false,
    sort_order: 60,
  },
  {
    slug: "fpc",
    name: "Firearms Policy Coalition",
    category: "legal",
    url: "https://www.firearmspolicy.org/",
    description: "2A litigation and policy advocacy.",
    note: null,
    colorado_contact: false,
    sort_order: 70,
  },
  {
    slug: "saf",
    name: "Second Amendment Foundation",
    category: "legal",
    url: "https://www.saf.org/",
    description: "2A litigation and education.",
    note: null,
    colorado_contact: false,
    sort_order: 80,
  },
  {
    slug: "mslf",
    name: "Mountain States Legal Foundation",
    category: "legal",
    url: "https://mslegal.org/",
    description: "Public-interest firm; Del Toro counsel.",
    note: null,
    colorado_contact: true,
    sort_order: 90,
  },
  {
    slug: "ogvp",
    name: "Office of Gun Violence Prevention",
    category: "government",
    url: "https://cdphe.colorado.gov/ogvp",
    description:
      "State OGVP programs and studies. Cite CDPHE / appropriations for annual cost — do not invent figures.",
    note: "Review state budget line items and OGVP reports for spending context.",
    colorado_contact: true,
    sort_order: 100,
  },
  {
    slug: "coviolence",
    name: "COViolence.org",
    category: "research",
    url: "https://coviolence.org/",
    description: "Colorado violence data resources.",
    note: null,
    colorado_contact: true,
    sort_order: 110,
  },
  {
    slug: "mental-health",
    name: "Mental health resources",
    category: "health",
    url: "https://cdhs.colorado.gov/behavioral-health",
    description: "Colorado behavioral health entry points. Crisis: 988.",
    note: null,
    colorado_contact: true,
    sort_order: 120,
  },
  {
    slug: "hold-my-guns",
    name: "Hold My Guns",
    category: "safety",
    url: "https://holdmyguns.org/",
    description: "Temporary out-of-home firearm storage.",
    note: null,
    colorado_contact: false,
    sort_order: 130,
  },
  {
    slug: "pink-pistols",
    name: "Pink Pistols",
    category: "community",
    url: "https://www.pinkpistols.org/",
    description: "LGBTQ firearm rights community.",
    note: null,
    colorado_contact: false,
    sort_order: 140,
  },
  {
    slug: "liberal-gun-club",
    name: "Liberal Gun Club",
    category: "community",
    url: "https://theliberalgunclub.com/",
    description: "Left-of-center firearm owners community.",
    note: null,
    colorado_contact: false,
    sort_order: 150,
  },
  {
    slug: "democrat-gun-club",
    name: "Democrat Gun Club",
    category: "community",
    url: null,
    description:
      "No established statewide Colorado chapter identified at publish time.",
    note: "To form one: bylaws, insurance/range access, affiliate with Liberal Gun Club or similar, list events here.",
    colorado_contact: false,
    sort_order: 160,
  },
];

export const FALLBACK_SB25_FAQS: FaqEntry[] = [
  {
    page_key: "sb25-003",
    question: "What does SB25-003 generally require?",
    answer:
      "SB25-003 restricts manufacture, sale, and purchase of specified semiautomatic firearms and rapid-fire devices beginning August 1, 2026, with a permit-to-purchase / training pathway and listed exemptions. Read the enrolled act and CPW / sheriff guidance for current rules.",
    sort_order: 10,
  },
  {
    page_key: "sb25-003",
    question: "Where do I find official class information?",
    answer:
      "Colorado Parks and Wildlife and county sheriffs publish implementing guidance. Confirm class availability with CPW and your county — the table on this page may lag official sources.",
    sort_order: 20,
  },
  {
    page_key: "sb25-003",
    question: "Is availability the same in every county?",
    answer:
      "No. Training and permit logistics vary. Use the county table and verify with local providers and the sheriff.",
    sort_order: 30,
  },
];

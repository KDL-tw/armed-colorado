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
    docket: "1:23-cv-02563",
    parties:
      "Alicia Garcia and Rocky Mountain Gun Owners v. Jared Polis (Governor) et al.",
    status: "active",
    summary:
      "Federal challenge to HB23-1219, the 2023 Waiting Period to Deliver a Firearm Act (three-day delay after background check). Filed October 1, 2023; preliminary injunction denied November 2023; 10th Circuit appeal No. 23-1380. Verify latest docket entries before relying on status.",
    timeline: [
      { date: "2023-10-01", label: "Complaint filed (1:23-cv-02563)" },
      {
        date: "2023-11",
        label: "Preliminary injunction denied; appeal to 10th Circuit (No. 23-1380)",
      },
    ],
    sources: [
      {
        label: "MSLF case page",
        url: "https://mslegal.org/cases/garcia-v-polis/",
      },
      {
        label: "CourtListener docket",
        url: "https://www.courtlistener.com/docket/67846039/rocky-mountain-gun-owners-v-polis/",
      },
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
        label: "MSLF case page",
        url: "https://mslegal.org/cases/del-toro-v-polis/",
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
    court: "U.S. District Court for the District of Colorado",
    docket: "1:26-cv-01929",
    parties: "United States v. City and County of Denver; Denver Police Department",
    status: "active",
    summary:
      "DOJ suit filed May 5, 2026, challenging Denver's ordinance banning semi-automatic rifles (so-called 'assault weapons') as an unconstitutional Second Amendment restriction.",
    timeline: [
      { date: "2026-05-05", label: "Complaint filed (1:26-cv-01929)" },
    ],
    sources: [
      {
        label: "DOJ press release",
        url: "https://www.justice.gov/opa/pr/justice-department-sues-city-denver-unconstitutional-weapons-bans",
      },
      { label: "Complaint (PDF)", url: "https://www.justice.gov/crt/media/1439466/dl" },
    ],
  },
  {
    slug: "doj-v-colorado",
    title: "DOJ v. Colorado",
    court: "U.S. District Court for the District of Colorado",
    docket: "1:26-cv-01950",
    parties: "United States v. State of Colorado",
    status: "active",
    summary:
      "DOJ suit filed May 6, 2026, challenging Colorado's ban on standard-capacity (large) firearm magazines as an unconstitutional Second Amendment restriction.",
    timeline: [
      { date: "2026-05-06", label: "Complaint filed (1:26-cv-01950)" },
    ],
    sources: [
      {
        label: "DOJ press release",
        url: "https://www.justice.gov/opa/pr/justice-department-sues-state-colorado-unconstitutional-weapons-ban",
      },
      { label: "Complaint (PDF)", url: "https://www.justice.gov/crt/media/1439591/dl" },
    ],
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
    slug: "cssa",
    name: "Colorado State Shooting Association",
    category: "advocacy",
    url: "https://cssa.org/",
    description: "State shooting association; Del Toro plaintiff.",
    note: null,
    colorado_contact: true,
    sort_order: 20,
  },
  {
    slug: "rmgo",
    name: "Rocky Mountain Gun Owners",
    category: "advocacy",
    url: "https://rmgo.org/",
    description: "Colorado gun-rights advocacy.",
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

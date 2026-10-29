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
    name: "Colorado Federal Firearms Licensees Association (CFFLA)",
    category: "advocacy",
    url: "https://www.cffla.org/",
    description:
      "The Colorado Federal Firearms Licensees Association is a trade association founded in 2024 that represents Colorado's 1,600-plus federal firearms licensees, from home-based Type 01 dealers to storefronts and manufacturers. It provides members with compliance tracking and industry coordination, and offers the public free gun-law tools including its GunLawBot Q&A service.",
    note: "Colorado contact: CFFLA, Colorado office (Eastlake, CO) — info@cffla.org.",
    colorado_contact: true,
    sort_order: 10,
  },
  {
    slug: "cssa",
    name: "Colorado State Shooting Association (CSSA)",
    category: "advocacy",
    url: "https://cssa.org/",
    description:
      "The Colorado State Shooting Association is a statewide organization uniting Colorado gun clubs, ranges, and individual shooting sports enthusiasts. It provides club membership services, shooting sports resources, and legislative engagement for the state's gun community from its Falcon, CO office.",
    note: "Colorado contact: Huey Laugesen, Executive Director — (719) 966-7512.",
    colorado_contact: true,
    sort_order: 20,
  },
  {
    slug: "rmgo",
    name: "Rocky Mountain Gun Owners (RMGO)",
    category: "advocacy",
    url: "https://www.rmgo.org/",
    description:
      "Rocky Mountain Gun Owners is a Colorado-based grassroots organization and the Colorado affiliate of the National Association for Gun Rights. Operating out of Loveland, it focuses on state legislative advocacy, bill tracking, and member mobilization on Colorado firearms policy.",
    note: "Colorado contact: RMGO Colorado office, P.O. Box 357, Loveland, CO — (888) 874-3006, info@rmgo.org.",
    colorado_contact: true,
    sort_order: 30,
  },
  {
    slug: "nra",
    name: "National Rifle Association (NRA)",
    category: "advocacy",
    url: "https://home.nra.org/",
    description:
      "The National Rifle Association is the largest gun-rights organization in the United States, with a membership that spans the country. It specializes in firearms education, competitive shooting programs, legislative advocacy, and legal defense of Second Amendment rights.",
    note: null,
    colorado_contact: false,
    sort_order: 40,
  },
  {
    slug: "naaga",
    name: "National African American Gun Association (NAAGA)",
    category: "advocacy",
    url: "https://naaga.co/",
    description:
      "The National African American Gun Association is the largest Black firearms organization in the United States. It specializes in firearms training, marksmanship and self-defense education, and a nationwide network of instructors and chapters.",
    note: null,
    colorado_contact: false,
    sort_order: 50,
  },
  {
    slug: "nagr",
    name: "National Association for Gun Rights (NAGR)",
    category: "advocacy",
    url: "https://gunrights.org/",
    description:
      "The National Association for Gun Rights is a grassroots advocacy organization with millions of members working to defend Second Amendment rights. It specializes in legislative and electoral engagement, bill-watching, and legal challenges to gun-control measures.",
    note: "Colorado contact: NAGR National Office, P.O. Box 1776, Loveland, CO — (970) 460-9010, info@gunrights.org.",
    colorado_contact: true,
    sort_order: 60,
  },
  {
    slug: "goa",
    name: "Gun Owners of America (GOA)",
    category: "advocacy",
    url: "https://www.gunowners.org/",
    description:
      "Gun Owners of America is a national nonprofit advocacy organization focused on defending the constitutional right to keep and bear arms. It specializes in state legislative tracking, Second Amendment Preservation Act standards, and litigation support for gun owners across the country.",
    note: null,
    colorado_contact: false,
    sort_order: 70,
  },
  {
    slug: "wfgr",
    name: "Women for Gun Rights (WfGR)",
    category: "advocacy",
    url: "https://womenforgunrights.org/",
    description:
      "Women for Gun Rights is a nationwide, non-partisan organization of women focused on preserving the Second Amendment. It specializes in firearms education, safety training, and advocacy aimed at the growing demographic of female gun owners.",
    note: "Colorado contact: Barb Miller, Colorado — comilehighgal@gmail.com.",
    colorado_contact: true,
    sort_order: 80,
  },
  {
    slug: "fpc",
    name: "Firearms Policy Coalition (FPC)",
    category: "legal",
    url: "https://www.firearmspolicy.org/",
    description:
      "The Firearms Policy Coalition is a 501(c)(4) nonprofit that pursues gun-rights issues through strategic litigation and grassroots activism. It specializes in high-impact court challenges to gun laws, legislative advocacy, and legal work through its FPC Law division.",
    note: null,
    colorado_contact: false,
    sort_order: 90,
  },
  {
    slug: "saf",
    name: "Second Amendment Foundation (SAF)",
    category: "legal",
    url: "https://saf.org/",
    description:
      "The Second Amendment Foundation is a national nonprofit law firm headquartered in Bellevue, Washington, that has litigated firearms-rights cases for more than 50 years. Its attorneys pursue federal and state court challenges to gun laws, including cases that have reached the U.S. Supreme Court.",
    note: null,
    colorado_contact: false,
    sort_order: 100,
  },
  {
    slug: "mslf",
    name: "Mountain States Legal Foundation (MSLF)",
    category: "legal",
    url: "https://mslegal.org/",
    description:
      "The Mountain States Legal Foundation is a nonprofit pro bono law firm based in Lakewood, Colorado, that litigates constitutional cases across the American West. Its Center to Keep and Bear Arms handles Second Amendment litigation alongside the firm's property rights, energy, and free speech work.",
    note: "Colorado contact: MSLF, 2596 South Lewis Way, Lakewood, CO — 303-292-2021, contact@mslegal.org.",
    colorado_contact: true,
    sort_order: 110,
  },
  {
    slug: "ogvp",
    name: "Colorado Office of Gun Violence Prevention (OGVP)",
    category: "government",
    url: "https://cdphe.colorado.gov/office-of-gun-violence-prevention",
    description:
      "The Office of Gun Violence Prevention is a unit of the Colorado Department of Public Health and Environment created by state law to coordinate the state's gun violence prevention efforts. It runs public awareness campaigns, administers community-based gun violence intervention grants, and maintains a public resource bank of gun violence data and research.",
    note: "Colorado contact: CDPHE, 4300 Cherry Creek Drive South, Denver, CO — 303-692-2000.",
    colorado_contact: true,
    sort_order: 120,
  },
  {
    slug: "coviolence",
    name: "Colorado Bipartisan Violence Report (CBVR)",
    category: "research",
    url: "https://coviolence.org/",
    description:
      "COViolence.org is the home of the Colorado Bipartisan Violence Report (CBVR), a citizen-led, data-driven initiative that presents analysis on violence, trends, and public safety data across the state of Colorado. The site hosts an interactive wiki and a suggestions page where the community can contribute to the report's analysis.",
    note: null,
    colorado_contact: false,
    sort_order: 130,
  },
  {
    slug: "faster",
    name: "FASTER Colorado",
    category: "safety",
    url: "https://fastercolorado.org/",
    description:
      "FASTER Colorado (Faculty/Administrator Safety Training & Emergency Response) is a nonprofit that provides firearm and emergency response training to school employees authorized as security officers under Colorado Revised Statute 18-12-214(3)(b), including the state's required annual training and re-qualification. Founded in 2017, it serves school districts, charter schools, and private schools across the state and also offers law-enforcement-oriented courses.",
    note: "Colorado contact: FASTER Colorado, PO Box 779, Elizabeth, CO — FASTERColorado@gmail.com.",
    colorado_contact: true,
    sort_order: 140,
  },
  {
    slug: "hold-my-guns",
    name: "Hold My Guns",
    category: "safety",
    url: "https://holdmyguns.org/",
    description:
      "Hold My Guns is a community-led network that connects firearm owners with vetted Federal Firearms Licensee retailers offering voluntary, secure, temporary firearm storage. The organization supplies partner stores with legal frameworks and contracts, offers QPR suicide prevention training, and maintains a referral toolkit for clinicians and community members.",
    note: null,
    colorado_contact: false,
    sort_order: 150,
  },
  {
    slug: "cffla-gun-law-bot",
    name: "CFFLA Gun Law Bot",
    category: "tools",
    url: "https://www.cffla.org/gun-laws",
    description:
      "The Gun Laws of Colorado page is CFFLA's free public search tool for Colorado firearms law, letting users look up specific bills, ask plain-language questions, or browse bills, statutes, and rules organized by category. It is part of the Colorado Federal Firearms Licensees Association's public resources, which include GunLawBot, a chat assistant that answers gun-law questions with citations to the underlying law.",
    note: "Colorado contact: CFFLA, Colorado office (Eastlake, CO) — info@cffla.org.",
    colorado_contact: true,
    sort_order: 160,
  },
  {
    slug: "ffl-marketplace",
    name: "FFL Trade Operations Marketplace & Syndication",
    category: "tools",
    url: "https://co2aportal.com/",
    description:
      "Colorado 2A Portal is a trade-compliance and procurement marketplace for Colorado federal firearms licensees, branded as an FFL trade operations marketplace and syndication platform and operated by The Alloi Group. It pairs FFL license and identity verification — including ATF Colorado FFL database searches and restricted-persons attestations — with a members-only marketplace, requiring membership in the Colorado Federal Firearms Licensee Association (CFFLA) or the Renhorne Independence Coalition (RIC).",
    note: null,
    colorado_contact: false,
    sort_order: 170,
  },
  {
    slug: "pink-pistols",
    name: "Pink Pistols",
    category: "community",
    url: "https://www.pinkpistols.org/",
    description:
      "The Pink Pistols is a national organization, operating as a division of Operation Blazing Sword, dedicated to the legal, safe, and responsible use of firearms for self-defense by the gender and sexual minority community. It maintains a nationwide directory of over 1,900 queer-friendly volunteer firearm educators and files amicus briefs in firearms-related legal cases.",
    note: null,
    colorado_contact: false,
    sort_order: 180,
  },
  {
    slug: "liberal-gun-club",
    name: "Liberal Gun Club",
    category: "community",
    url: "https://theliberalgunclub.com/",
    description:
      "The Liberal Gun Club is a national organization that provides a pro-Second Amendment voice for left-of-center gun owners and offers firearms safety and shooting instruction programs for newcomers to the shooting sports. It operates 34 chapters across 38 states, including a Rocky Mountain chapter covering Colorado, Wyoming, Utah, and New Mexico whose president is based in Pueblo, CO.",
    note: null,
    colorado_contact: false,
    sort_order: 190,
  },
  {
    slug: "umbrella-civic",
    name: "Umbrella Civic",
    category: "community",
    url: "https://www.umbrellacivic.com/",
    description:
      "Umbrella Civic is a Colorado-based legislative accountability platform that tracks the attribution chain from legislators through bills, statutes, and rules to the citizens affected by them. It offers AI-powered search across 2,000+ Colorado bills, 10,000+ Colorado Revised Statutes, and 1,000+ Code of Regulations rules, plus voting records for all 100 current state legislators.",
    note: "Colorado contact: Umbrella Civic — umbrellacivic@gmail.com.",
    colorado_contact: true,
    sort_order: 200,
  },
  {
    slug: "co-cares-for-safety",
    name: "Colorado Cares for Safety",
    category: "community",
    url: null,
    description: "",
    note: null,
    colorado_contact: false,
    sort_order: 210,
  },
  {
    slug: "mental-health",
    name: "Mental health resources",
    category: "health",
    url: "https://cdhs.colorado.gov/behavioral-health",
    description: "Colorado behavioral health entry points. Crisis: 988.",
    note: null,
    colorado_contact: true,
    sort_order: 220,
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

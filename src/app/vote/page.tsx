import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { GuideLayout } from "@/components/GuideLayout";

export const metadata: Metadata = {
  title: "Register to vote in Colorado",
};

/* ------------------------------------------------------------------ */
/* Data — every fact transcribed from the 2026-09-06 page (audit:     */
/* Appendix A of the plan). Do not edit values without re-checking    */
/* against coloradosos.gov.                                           */
/* ------------------------------------------------------------------ */

const METHODS = [
  {
    id: "online",
    name: "Online",
    badge: "Fastest",
    badgeClass: "bg-oxblood text-white",
    steps: [
      "Go to GoVoteColorado.gov",
      "Register or update your record",
      "Keep your Colorado driver's license, state ID, or the last 4 digits of your SSN ready",
    ],
    deadline: "8 days before Election Day for a mail ballot",
    href: "https://www.coloradosos.gov/voter/pages/pub/olvr/verifyNewVoter.xhtml",
    cta: "Register online",
  },
  {
    id: "mail",
    name: "By mail",
    badge: "Paper form",
    badgeClass: "bg-navy text-white",
    steps: [
      "Download the Colorado Voter Registration Form (PDF)",
      "Complete it",
      "Submit by mail, email, or fax to your county clerk and recorder",
    ],
    deadline:
      "8 days before Election Day (mail/fax/email) · 22 days before (registration drives)",
    href: "https://www.coloradosos.gov/pubs/elections/vote/VoterRegFormEnglish.pdf",
    cta: "Get the form (PDF)",
  },
  {
    id: "in-person",
    name: "In person",
    badge: "Latest deadline",
    badgeClass: "bg-amber text-navy",
    steps: [
      "Visit a Voter Service and Polling Center, the DMV, a public assistance office, an armed forces recruitment office, or any federal, state, or local government office",
      "Ask to register to vote",
    ],
    deadline: "Any day through Election Day",
    href: "https://www.coloradosos.gov/pubs/elections/Resources/CountyElectionOffices.html",
    cta: "Find your county clerk",
  },
] as const;

const ELIGIBILITY = [
  "Be a U.S. citizen",
  "Be a Colorado resident for at least 22 days before the election you intend to vote in",
  "Be at least 16 years old to preregister (must be 18 by Election Day to vote)",
  "Not currently serving a term of imprisonment for a felony conviction",
] as const;

const ELIGIBILITY_SPECIAL = [
  "You can vote if on probation for a misdemeanor or felony",
  "You can vote if a pretrial detainee awaiting trial",
  "If previously incarcerated for a felony, you must re-register to vote",
] as const;

const DEADLINES = [
  {
    method: "Online",
    mailBallot: "8 days before Election Day",
    inPerson: "Any day through Election Day",
  },
  {
    method: "Mail / Fax / Email",
    mailBallot: "8 days before Election Day",
    inPerson: "Any day through Election Day",
  },
  {
    method: "Voter Registration Drive",
    mailBallot: "22 days before Election Day",
    inPerson: "N/A",
  },
] as const;

const ID_PHOTO = [
  "Colorado driver's license or state ID",
  "U.S. passport or passport card",
  "Employee ID with photo (federal, state, or local government)",
  "Pilot's license (FAA)",
  "U.S. military ID with photo",
  "Student ID with photo (Colorado higher education)",
  "Veteran ID (VA)",
  "Tribal government ID certifying tribal membership",
] as const;

const ID_ADDRESS = [
  "Utility bill, bank statement, government check, or paycheck (within 60 days)",
  "Medicare or Medicaid card",
  "Certified U.S. birth certificate",
  "Certified documentation of naturalization",
  "Certificate of Degree of Indian or Alaskan Native Blood",
  "Division of youth services ID card",
] as const;

const SITUATIONS = [
  {
    title: "Homeless voters",
    body: "Use any physical location as your \u201chome base\u201d where you regularly return and intend to remain (park, vacant lot, shelter, campground, bus station, or other location). You must provide a mailing address for ballot delivery — a PO box works for that. PO boxes cannot be used as residence addresses.",
  },
  {
    title: "Foreclosure or eviction",
    body: "A foreclosure or eviction notice does NOT affect your voting rights. Still living there: no registration change needed. Moved: update your registration with your new \u201chome base.\u201d Moved out of state: register in your new state.",
  },
  {
    title: "Displaced by natural disaster",
    body: "If displaced by fire, flood, tornado, or other natural disaster, you may keep your previous address while temporarily displaced. If you have a new permanent residence, update your registration. If you plan to return, stay registered at the previous address. You may need to update your mailing address for ballot delivery.",
  },
] as const;

const OFFICIAL_LINKS = [
  {
    label: "GoVoteColorado.gov — register or update online",
    href: "https://www.coloradosos.gov/voter/pages/pub/olvr/verifyNewVoter.xhtml",
  },
  {
    label: "Colorado Voter Registration Form (PDF)",
    href: "https://www.coloradosos.gov/pubs/elections/vote/VoterRegFormEnglish.pdf",
  },
  {
    label: "County election offices and websites",
    href: "https://www.coloradosos.gov/pubs/elections/Resources/CountyElectionOffices.html",
  },
  {
    label: "Elections & Voting FAQs",
    href: "https://www.coloradosos.gov/pubs/elections/FAQs/FAQsMain.html",
  },
  {
    label: "Know Your Voting Rights (PDF)",
    href: "https://coloradosos.gov/pubs/elections/files/KnowYourRights.pdf",
  },
  {
    label: "Military & Overseas Voters (UOCAVA)",
    href: "https://www.coloradosos.gov/pubs/elections/UOCAVA.html",
  },
  {
    label: "Accessible Voting Options",
    href: "https://www.coloradosos.gov/pubs/elections/accessibleVoting.html",
  },
  {
    label: "Language Assistance Hotline",
    href: "https://www.coloradosos.gov/pubs/elections/FAQs/languageAssist.html",
  },
  {
    label: "Ballot Issue Information (Blue Book)",
    href: "https://leg.colorado.gov/content/initiatives/initiatives-blue-book-overview/ballot-information-booklet-blue-book",
  },
] as const;

const GET_INVOLVED = [
  {
    label: "\u201cI Voted\u201d digital sticker contest",
    href: "https://www.coloradosos.gov/pubs/elections/votedSticker/contest.html",
  },
  {
    label: "Colorado campus voting challenge",
    href: "https://www.coloradosos.gov/pubs/elections/allInChallenge.html",
  },
  {
    label: "High school voter registration challenge",
    href: "https://www.coloradosos.gov/pubs/elections/highSchoolVoterChallenge.html",
  },
  {
    label: "Become an election judge or student election judge",
    href: "https://www.coloradosos.gov/pubs/elections/Resources/BecomeElectionJudge.html",
  },
  {
    label: "Vote in honor of a veteran",
    href: "https://www.coloradosos.gov/pubs/elections/vote/veteran.html",
  },
] as const;

/* ------------------------------------------------------------------ */
/* Small presentational pieces                                         */
/* ------------------------------------------------------------------ */

function StepHeading({
  n,
  title,
  anchor,
  children,
}: {
  n: number;
  title: string;
  anchor: string;
  children?: React.ReactNode;
}) {
  return (
    <h2
      id={anchor}
      className="flex items-center gap-3 font-display text-2xl text-navy"
    >
      <span className="step-num" aria-hidden>
        {n}
      </span>
      <span>{title}</span>
      {children}
    </h2>
  );
}

function MethodCard({ m }: { m: (typeof METHODS)[number] }) {
  return (
    <article className="flex flex-col rounded-md border border-silver bg-white">
      <div className="flex items-center justify-between gap-2 border-b border-silver px-4 py-3">
        <h3 className="font-display text-lg text-navy">{m.name}</h3>
        <span
          className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${m.badgeClass}`}
        >
          {m.badge}
        </span>
      </div>
      <ol className="flex-1 space-y-2 px-4 py-4 text-sm text-muted">
        {m.steps.map((s, i) => (
          <li key={i} className="flex gap-2">
            <span className="mt-0.5 font-semibold text-oxblood">{i + 1}.</span>
            <span>{s}</span>
          </li>
        ))}
      </ol>
      <div className="border-t border-silver bg-cream px-4 py-3 text-sm">
        <span className="font-semibold text-navy">Deadline: </span>
        <span className="text-muted">{m.deadline}</span>
      </div>
      <div className="px-4 py-3">
        <a
          href={m.href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 bg-oxblood px-4 py-2 text-sm font-semibold text-white transition hover:bg-oxblood-deep"
        >
          {m.cta} →
        </a>
      </div>
    </article>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function VotePage() {
  return (
    <GuideLayout
      title="Register to vote in Colorado"
      lede="All Colorado residents can register online, by mail, or in person. All active registered voters receive mail ballots automatically."
    >
      {/* HERO — pre-downloaded asset, see Current state */}
      <div className="mb-8 overflow-hidden rounded-md border border-silver">
        <Image
          src="/images/colorado-capitol.jpg"
          alt="Colorado State Capitol in Denver — gold dome over the stone facade"
          width={1600}
          height={900}
          className="h-44 w-full object-cover object-center md:h-60"
        />
      </div>

      {/* STEP 1 — ELIGIBILITY */}
      <section id="eligibility" className="scroll-mt-24">
        <StepHeading n={1} title="Are you eligible?" anchor="eligibility" />
        <p className="mt-4">To register to vote in Colorado, you must:</p>
        <ul className="mt-3 space-y-2">
          {ELIGIBILITY.map((item) => (
            <li key={item} className="flex gap-3 text-muted">
              <span aria-hidden className="mt-1 text-oxblood">
                ✓
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <div className="callout mt-5">
          <p className="text-sm">
            <strong className="text-navy">Special cases:</strong> You can vote
            if on probation for a misdemeanor or felony. You can vote if a
            pretrial detainee awaiting trial. If previously incarcerated for a
            felony, you must re-register to vote.
          </p>
        </div>
      </section>

      {/* STEP 2 — METHOD CARDS */}
      <section id="how" className="mt-12 scroll-mt-24">
        <StepHeading n={2} title="Pick your method" anchor="how" />
        <p className="mt-4 text-muted">
          Three ways to register or update your registration. Online is the
          fastest; in-person has the latest deadline.
        </p>
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          {METHODS.map((m) => (
            <MethodCard key={m.id} m={m} />
          ))}
        </div>
      </section>

      {/* STEP 3 — DEADLINES */}
      <section id="deadlines" className="mt-12 scroll-mt-24">
        <StepHeading n={3} title="Hit the deadline" anchor="deadlines" />
        <p className="mt-4 text-muted">
          Deadlines are counted back from Election Day.
        </p>
        <div className="mt-5 overflow-hidden rounded-md border border-silver">
          <table className="w-full table-auto text-left text-sm">
            <thead className="bg-navy text-white">
              <tr>
                <th className="w-40 px-4 py-3 font-medium">Method</th>
                <th className="px-4 py-3 font-medium">
                  Deadline for Mail Ballot
                </th>
                <th className="px-4 py-3 font-medium">
                  Deadline for In-Person Only
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-silver bg-white">
              {DEADLINES.map((row) => (
                <tr key={row.method}>
                  <td className="px-4 py-3 font-medium text-navy">
                    {row.method}
                  </td>
                  <td className="whitespace-normal px-4 py-3 text-muted">
                    {row.mailBallot}
                  </td>
                  <td className="whitespace-normal px-4 py-3 text-muted">
                    {row.inPerson}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-sm text-muted">
          You may register in person at a Voter Service and Polling Center
          through Election Day regardless of registration method.
        </p>
      </section>

      {/* STEP 4 — BALLOT */}
      <section id="ballot" className="mt-12 scroll-mt-24">
        <StepHeading n={4} title="Get your ballot" anchor="ballot" />
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <article className="rounded-md border border-silver bg-white p-5">
            <h3 className="font-display text-lg text-navy">Track it</h3>
            <p className="mt-2 text-sm text-muted">
              Sign up for free email or SMS alerts and track your ballot from
              mailing through counting.
            </p>
            <a
              href="https://ballottrax.coloradosos.gov/voter/"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-block text-sm font-medium text-oxblood hover:underline"
            >
              ballottrax.coloradosos.gov →
            </a>
          </article>
          <article className="rounded-md border border-silver bg-white p-5">
            <h3 className="font-display text-lg text-navy">Cure it</h3>
            <p className="mt-2 text-sm text-muted">
              If your ballot signature is mismatched or missing, you can
              &ldquo;cure&rdquo; it online.
            </p>
            <a
              href="https://myballot.coloradosos.gov/ecure/app/home"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-block text-sm font-medium text-oxblood hover:underline"
            >
              Cure your ballot online →
            </a>
          </article>
        </div>
      </section>

      {/* ID — CHIPS */}
      <section id="id" className="mt-12 scroll-mt-24">
        <h2
          id="id-heading"
          className="flex items-center gap-3 font-display text-2xl text-navy"
        >
          <span className="step-num" aria-hidden>
            ID
          </span>
          <span>What ID to bring</span>
        </h2>
        <p className="mt-4 text-muted">
          All voters must present ID when voting in person. Any of the
          following is acceptable — all may be presented in digital format.
          Documents showing an address must show a Colorado address.
        </p>
        <h3 className="mt-6 font-display text-lg text-navy">
          Photo ID
        </h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {ID_PHOTO.map((id) => (
            <span key={id} className="id-chip">
              {id}
            </span>
          ))}
        </div>
        <h3 className="mt-6 font-display text-lg text-navy">
          Address-proof documents
        </h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {ID_ADDRESS.map((id) => (
            <span key={id} className="id-chip">
              {id}
            </span>
          ))}
        </div>
      </section>

      {/* SITUATIONS — COMPACT PANEL */}
      <section id="situations" className="mt-12 scroll-mt-24">
        <h2
          id="situations-heading"
          className="flex items-center gap-3 font-display text-2xl text-navy"
        >
          <span className="step-num" aria-hidden>
            ?
          </span>
          <span>If your situation is unusual</span>
        </h2>
        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
          {SITUATIONS.map((s) => (
            <article
              key={s.title}
              className="rounded-md border border-silver bg-cream p-5"
            >
              <h3 className="font-display text-lg text-navy">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {s.body}
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* RESOURCES — CONSOLIDATED CARD */}
      <section id="resources" className="mt-12 scroll-mt-24">
        <h2
          id="resources-heading"
          className="flex items-center gap-3 font-display text-2xl text-navy"
        >
          <span className="step-num" aria-hidden>
            ↗
          </span>
          <span>Official resources</span>
        </h2>
        <div className="mt-5 rounded-md border border-silver bg-white p-5">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <h3 className="flex items-center gap-2 font-display text-lg text-navy">
                <Image
                  src="/images/colorado-flag.svg"
                  alt="Flag of Colorado"
                  width={24}
                  height={16}
                />
                Colorado Secretary of State
              </h3>
              <ul className="mt-3 space-y-2 text-sm">
                {OFFICIAL_LINKS.map((l) => (
                  <li key={l.href}>
                    <a
                      href={l.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-oxblood hover:underline"
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-display text-lg text-navy">
                SOS Elections Division
              </h3>
              <ul className="mt-3 space-y-2 text-sm text-muted">
                <li>
                  Phone:{" "}
                  <a
                    href="tel:3038942200"
                    className="font-medium text-oxblood hover:underline"
                  >
                    303-894-2200
                  </a>
                </li>
                <li>
                  Email:{" "}
                  <a
                    href="mailto:State.ElectionDivision@coloradosos.gov"
                    className="font-medium text-oxblood hover:underline"
                  >
                    State.ElectionDivision@coloradosos.gov
                  </a>
                </li>
                <li>Address: 1700 Broadway, Suite 550, Denver CO 80290</li>
              </ul>
              <h3 className="mt-6 font-display text-lg text-navy">
                Get involved
              </h3>
              <ul className="mt-3 space-y-2 text-sm">
                {GET_INVOLVED.map((l) => (
                  <li key={l.href}>
                    <a
                      href={l.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-oxblood hover:underline"
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <p className="mt-12">
        <Link href="/" className="font-medium text-oxblood hover:underline">
          ← Back to home
        </Link>
      </p>
    </GuideLayout>
  );
}

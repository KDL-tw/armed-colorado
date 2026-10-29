import type { Metadata } from "next";
import Link from "next/link";
import { loadCommitteeCatalog } from "@/lib/committee/committee-client";
import { loadDistrictsData } from "@/lib/districts/districts-client";
import DistrictMap from "@/components/DistrictMap";
import LegislatorsTabs, { type TabId } from "@/components/LegislatorsTabs";

export const metadata: Metadata = { title: "Find Your Legislators" };

function isTabId(v: string | string[] | undefined): v is TabId {
  return v === "find" || v === "house" || v === "senate";
}

export default async function LegislatorsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const catalog = await loadCommitteeCatalog();
  const districts = loadDistrictsData();
  const params = await searchParams;
  const initialTab: TabId = isTabId(params.tab) ? params.tab : "find";

  return (
    <main className="min-h-[70vh] bg-white">
      <div className="mx-auto w-full max-w-6xl px-4 pb-20 pt-12 md:pt-14">
        <p className="text-sm uppercase tracking-[0.2em] text-oxblood">Armed Colorado</p>
        <h1 className="mt-3 font-display text-4xl text-navy md:text-5xl">
          Find Your Colorado Legislators
        </h1>
        <p className="mt-4 text-lg text-muted">
          Look up your House and Senate members, see the district maps, or browse the
          full committee rosters.
        </p>
        <div className="silver-rule my-8" />

        {/* 1 — Official app */}
        <section aria-labelledby="official-app">
          <h2 id="official-app" className="font-display text-3xl text-navy">
            Find Your Legislator
          </h2>
          <div className="prose-guide mt-4">
            <p>
              The official lookup on the Colorado General Assembly (coleg) site:
            </p>
            <p>
              <a
                href="https://leg.colorado.gov/find-my-legislator"
                target="_blank"
                rel="noopener noreferrer"
              >
                Find my legislator →
              </a>
            </p>
            <ul>
              <li>Enter your address to see your State Representative and State Senator.</li>
              <li>
                From each legislator profile you can find committee assignments,
                sponsored bills, and contact information.
              </li>
              <li>
                Session calendars and hearing schedules live on{" "}
                <a href="https://leg.colorado.gov/" target="_blank" rel="noopener noreferrer">
                  leg.colorado.gov
                </a>
                .
              </li>
            </ul>
            <p>
              Tip: when contacting your members about a gun bill, cite the bill number
              (e.g. SB25-003) and how it affects you personally.
            </p>
          </div>
        </section>

        {/* 2 — How districts are determined */}
        <section aria-labelledby="how-districts" className="mt-12">
          <h2 id="how-districts" className="font-display text-3xl text-navy">
            How Colorado&rsquo;s Districts Are Determined
          </h2>
          <div className="prose-guide mt-4">
            <p>
              The Colorado General Assembly has <strong>65 State House districts</strong>{" "}
              and <strong>35 State Senate districts</strong>.
            </p>
            <p>
              Since voters approved <strong>Amendments Y and Z in 2018</strong> (Colorado
              Constitution, Article V, sections 44&ndash;48), an independent{" "}
              <strong>12-member Legislative Redistricting Commission</strong> draws the
              state&rsquo;s legislative maps &mdash; not the legislature itself. Six
              commissioners are randomly selected by a panel of three retired judges from
              a pool of 150 nominees drawn from roughly 1,050 qualified applicants; the
              other six come from pools nominated by the four legislative leaders,
              selected the same way. Nonpartisan staff draft the plans, the commission
              holds public hearings across the state, and the final plan is submitted to
              the <strong>Colorado Supreme Court</strong>, which must approve it.
              (Amendment Y created a parallel independent commission for the
              state&rsquo;s U.S. congressional districts.)
            </p>
            <p>
              Redistricting happens <strong>every ten years after each federal decennial
              census</strong>. The maps below are the current plan: the commission
              adopted them in October 2021, the Colorado Supreme Court approved them on{" "}
              <strong>November 15, 2021</strong> (with minor boundary adjustments
              approved March 18, 2022), and they have been in effect since the 2022
              elections. The next redraw will follow the 2030 census.
            </p>
            <p className="text-sm text-muted">
              Sources:{" "}
              <a
                href="https://redistricting.colorado.gov/content/about"
                target="_blank"
                rel="noopener noreferrer"
                className="text-oxblood hover:underline"
              >
                redistricting.colorado.gov &mdash; About the Commissions
              </a>{" "}
              &middot;{" "}
              <a
                href="https://redistricting.colorado.gov/content/house-final-approved"
                target="_blank"
                rel="noopener noreferrer"
                className="text-oxblood hover:underline"
              >
                Final Approved House Plan
              </a>{" "}
              &middot;{" "}
              <a
                href="https://redistricting.colorado.gov/content/senate-final-approved-errata"
                target="_blank"
                rel="noopener noreferrer"
                className="text-oxblood hover:underline"
              >
                Final Approved Senate Plan
              </a>{" "}
              &middot;{" "}
              <a
                href="https://redistricting.lls.edu/state/colorado/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-oxblood hover:underline"
              >
                LLS Redistricting Project &mdash; Colorado
              </a>
            </p>
          </div>
        </section>

        {/* 3 — House districts */}
        <section aria-labelledby="house-districts" className="mt-12">
          <h2 id="house-districts" className="font-display text-3xl text-navy">
            House Districts
          </h2>
          <p className="mt-2 text-muted">
            All 65 Colorado House districts, colored by district, with county boundaries
            underneath and insets for the Denver and Colorado Springs metro areas.
          </p>
          <div className="mt-4">
            <DistrictMap
              chamber="house"
              data={districts.house}
              counties={districts.counties}
              planYear={districts.planYear}
              effectiveSince={districts.effectiveSince}
            />
          </div>
        </section>

        {/* 4 — Senate districts */}
        <section aria-labelledby="senate-districts" className="mt-12">
          <h2 id="senate-districts" className="font-display text-3xl text-navy">
            Senate Districts
          </h2>
          <p className="mt-2 text-muted">
            All 35 Colorado Senate districts, colored by district, with county boundaries
            underneath and insets for the Denver and Colorado Springs metro areas.
          </p>
          <div className="mt-4">
            <DistrictMap
              chamber="senate"
              data={districts.senate}
              counties={districts.counties}
              planYear={districts.planYear}
              effectiveSince={districts.effectiveSince}
            />
          </div>
        </section>

        {/* 5 — Existing committee tabs (unchanged) */}
        <section aria-labelledby="committees" className="mt-16">
          <h2 id="committees" className="font-display text-3xl text-navy">
            Committee Rosters
          </h2>
          <div className="mt-4">
            <LegislatorsTabs catalog={catalog} initialTab={initialTab} />
          </div>
        </section>

        <p className="mt-12 text-sm text-muted">
          <Link href="/" className="font-medium text-oxblood hover:underline">
            &larr; Home
          </Link>
        </p>
      </div>
    </main>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { loadDistrictsData } from "@/lib/districts/districts-client";
import { METRO_DEFS } from "@/lib/districts/metros";
import MetroMap from "@/components/MetroMap";

type Props = {
  params: Promise<{ chamber: string; metro: string }>;
};

const CHAMBERS = new Set(["house", "senate"]);
const METRO_KEYS = new Set(METRO_DEFS.map((m) => m.key));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { chamber, metro } = await params;
  const label = chamber === "house" ? "House" : "Senate";
  const title = METRO_DEFS.find((m) => m.key === metro)?.title ?? "Metro";
  return { title: `${title} ${label} Districts` };
}

export default async function MetroDistrictsPage({ params }: Props) {
  const { chamber, metro } = await params;
  if (!CHAMBERS.has(chamber) || !METRO_KEYS.has(metro)) notFound();
  const c = chamber as "house" | "senate";
  const districts = loadDistrictsData();
  const label = c === "house" ? "House" : "Senate";
  const title = METRO_DEFS.find((m) => m.key === metro)!.title;

  return (
    <main className="min-h-[70vh] bg-white">
      <div className="mx-auto w-full max-w-5xl px-4 pb-20 pt-12 md:pt-14">
        <Link
          href="/legislators"
          className="text-sm text-oxblood hover:underline"
        >
          &larr; Find Your Legislators
        </Link>
        <p className="mt-6 text-sm uppercase tracking-[0.2em] text-oxblood">
          {label} Districts
        </p>
        <h1 className="mt-3 font-display text-4xl text-navy md:text-5xl">
          {title}
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-muted">
          Enlarged {label} district map for the {title} area, with
          county boundaries underneath. Hover or tap a district to see its
          number.
        </p>
        <div className="mt-6">
          <MetroMap
            chamber={c}
            data={districts[c]}
            counties={districts.counties}
            metroKey={metro}
            planYear={districts.planYear}
            effectiveSince={districts.effectiveSince}
          />
        </div>
      </div>
    </main>
  );
}

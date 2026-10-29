import type { Metadata } from "next";
import Link from "next/link";
import { loadCommitteeCatalog } from "@/lib/committee/committee-client";
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
  const params = await searchParams;
  const initialTab: TabId = isTabId(params.tab) ? params.tab : "find";

  return (
    <main className="min-h-[70vh] bg-white">
      <div className="mx-auto w-full max-w-5xl px-4 pb-20 pt-12 md:pt-14">
        <p className="text-sm uppercase tracking-[0.2em] text-oxblood">Armed Colorado</p>
        <h1 className="mt-3 font-display text-4xl text-navy md:text-5xl">
          Find Your Colorado Legislators
        </h1>
        <p className="mt-4 text-lg text-muted">
          Look up your House and Senate members, or browse the full committee rosters.
        </p>
        <div className="silver-rule my-8" />
        <LegislatorsTabs catalog={catalog} initialTab={initialTab} />
        <p className="mt-12 text-sm text-muted">
          <Link href="/" className="font-medium text-oxblood hover:underline">
            ← Home
          </Link>
        </p>
      </div>
    </main>
  );
}

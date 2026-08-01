import type { Metadata } from "next";
import Link from "next/link";
import { getLitigationCases } from "@/lib/data/queries";
import { ContentShell } from "@/components/ContentShell";

export const metadata: Metadata = {
  title: "Litigation tracker",
};

export default async function LitigationPage() {
  const cases = await getLitigationCases();

  return (
    <ContentShell width="5xl">
      <p className="text-sm uppercase tracking-[0.2em] text-oxblood">Courts</p>
      <h1 className="mt-3 font-display text-4xl text-navy md:text-5xl">
        2A litigation tracker
      </h1>
      <p className="mt-4 max-w-2xl text-muted">
        Digestible status updates on Second Amendment and firearms litigation
        involving Colorado. Not a substitute for PACER or counsel.
      </p>

      <ul className="mt-12 space-y-6">
        {cases.map((c) => (
          <li key={c.slug} className="border-t border-navy/10 pt-6">
            <Link href={`/litigation/${c.slug}`} className="group block">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="font-display text-2xl text-navy group-hover:text-oxblood">
                  {c.title}
                </h2>
                <span className="text-xs uppercase tracking-wider text-muted">
                  {c.status}
                </span>
              </div>
              {c.docket ? (
                <p className="mt-1 text-sm text-muted">{c.docket}</p>
              ) : null}
              <p className="mt-3 max-w-3xl text-muted">{c.summary}</p>
            </Link>
          </li>
        ))}
      </ul>
    </ContentShell>
  );
}

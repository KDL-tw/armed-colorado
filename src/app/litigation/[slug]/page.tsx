import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getLitigationCase } from "@/lib/data/queries";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const c = await getLitigationCase(slug);
  return { title: c?.title ?? "Case" };
}

export default async function LitigationDetailPage({ params }: Props) {
  const { slug } = await params;
  const c = await getLitigationCase(slug);
  if (!c) notFound();

  return (
    <main className="mx-auto w-full max-w-3xl px-4 pb-20 pt-12 md:pt-14">
      <Link href="/litigation" className="text-sm text-amber hover:underline">
        ← Litigation tracker
      </Link>
      <p className="mt-6 text-xs uppercase tracking-widest text-muted">
        {c.status}
      </p>
      <h1 className="mt-2 font-display text-4xl text-navy">{c.title}</h1>
      {c.court ? <p className="mt-3 text-muted">{c.court}</p> : null}
      {c.docket ? (
        <p className="mt-1 text-sm text-muted">Docket {c.docket}</p>
      ) : null}

      <section className="mt-10">
        <h2 className="font-display text-2xl text-navy">Overview</h2>
        <p className="mt-3 leading-relaxed text-muted">{c.summary}</p>
        {c.parties ? (
          <p className="mt-4 text-sm text-muted">
            <span className="text-navy">Parties: </span>
            {c.parties}
          </p>
        ) : null}
      </section>

      <section className="mt-10">
        <h2 className="font-display text-2xl text-navy">Timeline</h2>
        <ol className="mt-4 space-y-3 border-l border-navy/15 pl-5">
          {c.timeline.map((item, i) => (
            <li key={`${item.date}-${i}`}>
              <p className="text-xs uppercase tracking-wider text-amber">
                {item.date}
              </p>
              <p className="text-muted">{item.label}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-2xl text-navy">Sources</h2>
        <ul className="mt-3 space-y-2">
          {c.sources.map((s) => (
            <li key={s.url}>
              <a
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-oxblood underline underline-offset-4"
              >
                {s.label}
              </a>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

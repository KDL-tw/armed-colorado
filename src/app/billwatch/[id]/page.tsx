import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { umbrellaClient } from "@/lib/umbrella/client";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const bill = await umbrellaClient.getBill(id);
  return { title: bill ? `${bill.number}` : "Bill" };
}

export default async function BillDetailPage({ params }: Props) {
  const { id } = await params;
  const bill = await umbrellaClient.getBill(id);
  if (!bill) notFound();

  const sponsors =
    bill.sponsors.length > 0
      ? bill.sponsors
      : await umbrellaClient.getSponsors(id);
  const fiscal =
    bill.fiscalCost ?? (await umbrellaClient.getFiscalCost(id));

  return (
    <main className="mx-auto w-full max-w-3xl px-4 pb-20 pt-28">
      <Link href="/billwatch" className="text-sm text-amber hover:underline">
        ← Billwatch
      </Link>
      <p className="mt-6 text-sm uppercase tracking-widest text-silver-muted">
        {bill.status}
      </p>
      <h1 className="mt-2 font-display text-4xl text-cream">{bill.number}</h1>
      <p className="mt-3 text-xl text-silver">{bill.title}</p>

      {bill.officialUrl ? (
        <p className="mt-6">
          <a
            href={bill.officialUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-amber underline underline-offset-4"
          >
            Official bill text →
          </a>
        </p>
      ) : null}

      <section className="mt-10">
        <h2 className="font-display text-2xl text-cream">Summary</h2>
        <p className="mt-3 leading-relaxed text-silver">
          {bill.summary ?? "Summary unavailable."}
        </p>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-2xl text-cream">Sponsors</h2>
        {sponsors.length === 0 ? (
          <p className="mt-3 text-silver">No sponsors listed.</p>
        ) : (
          <ul className="mt-3 space-y-2 text-silver">
            {sponsors.map((s) => (
              <li key={`${s.name}-${s.role}`}>
                {s.name}
                {s.role ? ` (${s.role})` : ""}
                {s.chamber ? ` · ${s.chamber}` : ""}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10">
        <h2 className="font-display text-2xl text-cream">
          Cost to Colorado
        </h2>
        <p className="mt-3 text-silver">
          {fiscal?.summary ??
            "SMART Act / fiscal note data not available in stub mode."}
        </p>
        {fiscal?.amountUsd != null ? (
          <p className="mt-2 font-display text-3xl text-amber">
            ${fiscal.amountUsd.toLocaleString()}
          </p>
        ) : null}
      </section>
    </main>
  );
}

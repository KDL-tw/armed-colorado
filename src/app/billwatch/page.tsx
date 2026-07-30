import type { Metadata } from "next";
import Link from "next/link";
import { getUmbrellaHealth, umbrellaClient } from "@/lib/umbrella/client";

export const metadata: Metadata = {
  title: "Billwatch",
};

export default async function BillwatchPage() {
  const health = getUmbrellaHealth();
  const bills = await umbrellaClient.listGunBills();

  return (
    <main className="mx-auto w-full max-w-5xl px-4 pb-20 pt-28">
      <p className="text-sm uppercase tracking-[0.2em] text-amber">Legislation</p>
      <h1 className="mt-3 font-display text-4xl text-cream md:text-5xl">
        Billwatch
      </h1>
      <p className="mt-4 max-w-2xl text-silver">
        Every Colorado gun bill — proposed, passed, or died — with official
        links, plain-language summaries, sponsors, and fiscal / SMART Act cost
        when available via Umbrella Civic.
      </p>
      <div className="mt-6 inline-flex items-center gap-2 rounded border border-silver/25 px-3 py-1.5 text-xs text-silver">
        <span
          className={`h-2 w-2 rounded-full ${
            health.status === "ok" ? "bg-amber" : "bg-oxblood"
          }`}
        />
        API: {health.status}
        {health.configured ? "" : " (stub)"}
      </div>

      {bills.length === 0 ? (
        <div className="mt-12 border border-dashed border-silver/30 bg-navy/40 px-6 py-14 text-center">
          <p className="font-display text-2xl text-cream">No bills loaded</p>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-silver">
            Billwatch connects to Umbrella Civic when credentials are
            configured. Until then this list stays empty — we do not invent
            placeholder bills.
          </p>
          <p className="mt-6 text-xs text-silver-muted">
            Request API access:{" "}
            <a
              className="text-amber underline"
              href="mailto:umbrellacivic@gmail.com"
            >
              umbrellacivic@gmail.com
            </a>
          </p>
        </div>
      ) : (
        <ul className="mt-10 divide-y divide-silver/15 border-y border-silver/15">
          {bills.map((bill) => (
            <li key={bill.id} className="py-5">
              <Link
                href={`/billwatch/${bill.id}`}
                className="group block transition"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-semibold text-cream group-hover:text-amber">
                    {bill.number}
                  </span>
                  <span className="text-xs uppercase tracking-wider text-silver-muted">
                    {bill.status}
                  </span>
                </div>
                <p className="mt-1 text-silver">{bill.title}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <section className="mt-14">
        <h2 className="font-display text-2xl text-cream">Expected fields</h2>
        <ul className="mt-4 space-y-2 text-sm text-silver">
          <li>Official bill link (leg.colorado.gov)</li>
          <li>Plain-language summary</li>
          <li>Sponsors (prime &amp; co)</li>
          <li>Status: proposed / passed / died</li>
          <li>Fiscal cost / SMART Act hearing scrape (stub until API)</li>
        </ul>
      </section>
    </main>
  );
}

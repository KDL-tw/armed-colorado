import type { Metadata } from "next";
import Link from "next/link";
import { getCountyAvailability, getFaqs } from "@/lib/data/queries";

export const metadata: Metadata = { title: "SB25-003" };

export default async function Sb25003Page() {
  const faqs = await getFaqs("sb25-003");
  const counties = await getCountyAvailability();

  return (
    <main className="mx-auto w-full max-w-3xl px-4 pb-20 pt-28">
      <p className="text-sm uppercase tracking-[0.2em] text-amber">Statute</p>
      <h1 className="mt-3 font-display text-4xl text-cream md:text-5xl">
        SB25-003 class requirements
      </h1>
      <p className="mt-4 text-silver">
        FAQs and county availability for training / permit pathways under
        Colorado&apos;s semiautomatic firearms act. Confirm everything with CPW
        and your sheriff.
      </p>
      <p className="mt-4">
        <a
          href="https://leg.colorado.gov/bills/sb25-003"
          target="_blank"
          rel="noopener noreferrer"
          className="text-amber underline underline-offset-4"
        >
          Official bill page →
        </a>
      </p>

      <section className="mt-12">
        <h2 className="font-display text-2xl text-cream">FAQs</h2>
        <dl className="mt-6 space-y-6">
          {faqs.map((faq) => (
            <div key={faq.id ?? faq.question}>
              <dt className="font-semibold text-cream">{faq.question}</dt>
              <dd className="mt-2 text-silver">{faq.answer}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-2xl text-cream">
          Availability by county
        </h2>
        {counties.length === 0 ? (
          <p className="mt-4 text-silver">
            No county rows yet. Add them in{" "}
            <Link href="/admin" className="text-amber underline">
              Admin
            </Link>{" "}
            as CPW / sheriff class schedules appear.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[28rem] text-left text-sm">
              <thead>
                <tr className="border-b border-silver/25 text-silver-muted">
                  <th className="py-2 pr-4 font-medium">County</th>
                  <th className="py-2 pr-4 font-medium">Status</th>
                  <th className="py-2 font-medium">Notes</th>
                </tr>
              </thead>
              <tbody>
                {counties.map((row) => (
                  <tr
                    key={row.id ?? row.county}
                    className="border-b border-silver/10"
                  >
                    <td className="py-3 pr-4 text-cream">{row.county}</td>
                    <td className="py-3 pr-4 text-silver">{row.status}</td>
                    <td className="py-3 text-silver">
                      {row.class_url ? (
                        <a
                          href={row.class_url}
                          className="text-amber underline"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Class link
                        </a>
                      ) : null}
                      {row.provider_notes
                        ? `${row.class_url ? " — " : ""}${row.provider_notes}`
                        : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p className="mt-10 text-sm text-silver-muted">
        Related:{" "}
        <Link href="/litigation/del-toro-v-polis" className="text-amber">
          Del Toro v. Polis
        </Link>
      </p>
    </main>
  );
}

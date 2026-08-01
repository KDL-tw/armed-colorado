import type { Metadata } from "next";
import { getResources } from "@/lib/data/queries";
import { ContentShell } from "@/components/ContentShell";

export const metadata: Metadata = { title: "Resources" };

export default async function ResourcesPage() {
  const resources = await getResources();
  const byCategory = resources.reduce<Record<string, typeof resources>>(
    (acc, r) => {
      const key = r.category || "other";
      acc[key] = acc[key] ?? [];
      acc[key].push(r);
      return acc;
    },
    {},
  );

  return (
    <ContentShell width="4xl">
      <p className="text-sm uppercase tracking-[0.2em] text-oxblood">Directory</p>
      <h1 className="mt-3 font-display text-4xl text-navy md:text-5xl">
        Resource links
      </h1>
      <p className="mt-4 max-w-2xl text-muted">
        Advocacy, legal, government, health, and community organizations.
        Listings are informational — verify contacts and positions yourself.
      </p>

      {Object.entries(byCategory).map(([category, items]) => (
        <section key={category} className="mt-12">
          <h2 className="font-display text-2xl capitalize text-navy">
            {category}
          </h2>
          <ul className="mt-5 space-y-6">
            {items.map((r) => (
              <li
                key={r.slug}
                className="border-t border-navy/10 pt-5 first:border-t-0 first:pt-0"
              >
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  {r.url ? (
                    <a
                      href={r.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-lg font-semibold text-navy hover:text-oxblood"
                    >
                      {r.name}
                    </a>
                  ) : (
                    <span className="text-lg font-semibold text-navy">
                      {r.name}
                    </span>
                  )}
                  {r.colorado_contact === false ? (
                    <span className="text-xs uppercase tracking-wider text-oxblood">
                      No CO contact noted
                    </span>
                  ) : null}
                </div>
                <p className="mt-2 text-muted">{r.description}</p>
                {r.note ? (
                  <p className="mt-2 text-sm text-muted">{r.note}</p>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </ContentShell>
  );
}

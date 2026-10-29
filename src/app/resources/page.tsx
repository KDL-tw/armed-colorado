import type { Metadata } from "next";
import { getResources } from "@/lib/data/queries";
import { ContentShell } from "@/components/ContentShell";

export const metadata: Metadata = { title: "Resources" };

const MINOR_WORDS = new Set([
  "a", "an", "the", "and", "but", "or", "nor", "for", "so", "yet", "to",
  "of", "in", "on", "at", "by", "as", "via", "per",
]);

function titleCase(s: string): string {
  return s
    .split(" ")
    .map((w, i) => {
      if (i > 0 && MINOR_WORDS.has(w.toLowerCase())) return w.toLowerCase();
      return w.charAt(0).toUpperCase() + w.slice(1);
    })
    .join(" ");
}

const CATEGORY_LABELS: Record<string, string> = {
  advocacy: "Advocacy",
  legal: "Legal",
  government: "Government",
  research: "Research & Data",
  safety: "Safety & Training",
  tools: "Tools & Services",
  community: "Community",
  health: "Health",
};

const CATEGORY_ORDER = [
  "advocacy", "legal", "government", "research",
  "safety", "tools", "community", "health",
];

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
  const orderedCategories = Object.keys(byCategory).sort(
    (a, b) =>
      (CATEGORY_ORDER.indexOf(a) ?? 99) - (CATEGORY_ORDER.indexOf(b) ?? 99),
  );

  return (
    <ContentShell width="4xl">
      <p className="text-sm uppercase tracking-[0.2em] text-oxblood">Directory</p>
      <h1 className="mt-3 font-display text-4xl text-navy md:text-5xl">
        Resource Links
      </h1>
      <p className="mt-4 max-w-2xl text-muted">
        Advocacy, legal, government, research, safety, tools, and community
        organizations. Listings are informational — verify contacts and
        positions yourself.
      </p>

      {orderedCategories.map((category) => (
        <section key={category} className="mt-12">
          <h2 className="font-display text-2xl text-navy">
            {CATEGORY_LABELS[category] ?? titleCase(category)}
          </h2>
          <ul className="mt-5 space-y-6">
            {byCategory[category].map((r) => (
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
                    <span className="text-sm font-bold text-red-600">
                      [NO COLORADO CONTACT]
                    </span>
                  ) : null}
                </div>
                {r.description ? (
                  <p className="mt-2 text-muted">{r.description}</p>
                ) : null}
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

import type { Metadata } from "next";
import { loadGunBillCatalog } from "@/lib/gun-bill/catalog-client";
import { ContentShell } from "@/components/ContentShell";
import { BillTableClient } from "./BillTableClient";
import Link from "next/link";
import type { GunBillCatalogEntry, GunBillCatalogYear } from "@/lib/gun-bill/types";

export const metadata: Metadata = {
  title: "Billwatch - Colorado Gun Bill Catalog",
};

// Status colors
const statusColors: Record<string, string> = {
  "Signed into Law": "text-oxblood font-bold",
  "Killed in Committee": "text-oxblood",
  "Dead": "text-oxblood",
  "Passed House": "text-navy",
  "Passed Senate": "text-navy",
  "Held-over": "text-amber",
};

export default async function BillwatchPage() {
  let catalog: GunBillCatalogYear[] = [];

  try {
    catalog = await loadGunBillCatalog();
  } catch (error) {
    console.error("Error loading catalog:", error);
  }

  return (
    <ContentShell width="screen">
      <BillTableClient />
      <p className="text-sm uppercase tracking-[0.2em] text-oxblood">
        Legislation
      </p>
      <h1 className="mt-3 font-display text-4xl text-navy md:text-5xl">
        Billwatch
      </h1>
      <p className="mt-4 max-w-2xl text-muted">
        Every Colorado gun bill — proposed, passed, or died
      </p>

      {/* Search and Filter Controls */}
      <div className="mt-8 flex flex-col gap-4 md:flex-row md:items-center">
        <div className="flex-1">
          <label className="mb-1 block text-xs uppercase tracking-wider text-muted">
            Search
          </label>
          <input
            type="text"
            id="search-input"
            placeholder="Search by bill number, title, or summary..."
            className="w-full rounded border border-navy/20 px-3 py-2 text-sm outline-none focus:border-navy focus:ring-1 focus:ring-navy"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs uppercase tracking-wider text-muted">
            Filter by Year
          </label>
          <select
            id="year-filter"
            className="w-full rounded border border-navy/20 px-3 py-2 text-sm outline-none focus:border-navy focus:ring-1 focus:ring-navy"
          >
            <option value="">All Years</option>
            {catalog.map((year) => (
              <option key={year.year} value={year.year}>
                {year.year}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Bill Tables by Year */}
      <div id="bill-tables-container" className="mt-10">
        {catalog.length === 0 ? (
          <div className="mt-12 border border-dashed border-navy/15 bg-white px-6 py-14 text-center">
            <p className="font-display text-2xl text-navy">
              No bills loaded
            </p>
            <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-muted">
              Unable to load bill catalog. Please try again later.
            </p>
          </div>
        ) : (
          catalog.map((yearData) => {
            // Filter out duplicate bills and bills with corrupted URLs within
            // the same year. A URL containing %20 indicates a title was
            // mistakenly stored in the URL field — drop that row. A missing
            // officialUrl is NOT an error: the row still renders, with the
            // bill number and title as plain text (no hyperlink).
            const seenKeys = new Set<string>();
            const validBills = yearData.bills.filter((bill) => {
              // Skip bills with corrupted URLs (%20 indicates a title in the URL field)
              if (bill.officialUrl && bill.officialUrl.includes('%20')) {
                return false;
              }
              // Skip duplicates by billNumber within same year
              const key = `${bill.billNumber}-${yearData.year}`;
              if (seenKeys.has(key)) {
                return false;
              }
              seenKeys.add(key);
              return true;
            });

            return (
              <section key={yearData.year} data-year={yearData.year} className="mt-12">
                <h2 className="font-display text-3xl text-navy mb-6">
                  {yearData.year} Bills - Colorado General Assembly
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse table-auto">
                    <thead>
                      <tr className="border-b border-navy/20">
                        <th className="w-32 px-3 py-2 text-left text-xs uppercase tracking-wider text-muted font-semibold whitespace-nowrap">
                          Status
                        </th>
                        <th className="w-28 px-3 py-2 text-left text-xs uppercase tracking-wider text-muted font-semibold whitespace-nowrap">
                          Enacted
                        </th>
                        <th className="w-28 px-3 py-2 text-left text-xs uppercase tracking-wider text-muted font-semibold whitespace-nowrap">
                          Bill Number
                        </th>
                        <th className="py-2 text-left text-xs uppercase tracking-wider text-muted font-semibold">
                          Title
                        </th>
                        <th className="py-2 text-left text-xs uppercase tracking-wider text-muted font-semibold">
                          Summary
                        </th>
                        <th className="w-48 py-2 text-left text-xs uppercase tracking-wider text-muted font-semibold whitespace-nowrap">
                          Prime Sponsors
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {validBills.map((bill: GunBillCatalogEntry) => {
                        const isValidUrl = bill.officialUrl && !bill.officialUrl.includes('%20');
                        return (
                          <tr
                            key={`${bill.billNumber}-${yearData.year}`}
                            data-search={`${bill.billNumber} ${bill.title} ${bill.summary} ${bill.status}`.toLowerCase()}
                            className="border-b border-navy/10 hover:bg-navy/5"
                          >
                            <td className="w-32 px-3 py-3">
                              <span className={statusColors[bill.status] || "text-muted"}>
                                {bill.status}
                              </span>
                            </td>
                            <td className="w-28 px-3 py-3 whitespace-nowrap text-muted">
                              {bill.enactmentDate || "—"}
                            </td>
                            <td className="w-28 px-3 py-3">
                              {bill.crsUrl ? (
                                <Link
                                  href={bill.crsUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 underline hover:text-blue-800"
                                >
                                  {bill.billNumber}
                                </Link>
                              ) : isValidUrl && bill.officialUrl ? (
                                <Link
                                  href={bill.officialUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 underline hover:text-blue-800"
                                >
                                  {bill.billNumber}
                                </Link>
                              ) : (
                                <span>{bill.billNumber}</span>
                              )}
                            </td>
                            <td className="min-w-[280px] py-3 pr-6">
                              {bill.crsUrl ? (
                                <Link
                                  href={bill.crsUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-navy hover:text-oxblood font-medium"
                                >
                                  {bill.title}
                                </Link>
                              ) : isValidUrl && bill.officialUrl ? (
                                <Link
                                  href={bill.officialUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-navy hover:text-oxblood font-medium"
                                >
                                  {bill.title}
                                </Link>
                              ) : (
                                <span className="text-navy font-medium">{bill.title}</span>
                              )}
                            </td>
                            <td className="min-w-[320px] py-3 pl-2 pr-6 text-muted">
                              <p className="whitespace-normal break-words">{bill.summary}</p>
                            </td>
                            <td className="w-56 py-3 pl-2 text-muted text-sm">
                              <ul className="list-none space-y-1 p-0 m-0">
                                {(bill.sponsorLinks ??
                                  bill.sponsors.map((name) => ({ name, slug: null }))
                                ).map((s, index) => (
                                  <li key={`${s.name}-${index}`}>
                                    {s.slug ? (
                                      <a
                                        href={`https://leg.colorado.gov/legislators/${s.slug}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 underline hover:text-blue-800"
                                      >
                                        {s.name}
                                      </a>
                                    ) : (
                                      s.name
                                    )}
                                  </li>
                                ))}
                              </ul>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            );
          })
        )}
      </div>

      {/* Legend */}
      <section className="mt-14 border-t border-navy/10 pt-8">
        <h2 className="font-display text-2xl text-navy mb-4">Legend</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-1">
          <div>
            <h3 className="text-sm font-semibold text-navy mb-2">
              Status Indicators
            </h3>
            <ul className="space-y-1 text-sm text-muted">
              <li>
                <span className="text-oxblood font-bold">Signed into Law</span> - Bill enacted
              </li>
              <li>
                <span className="text-oxblood">Killed in Committee</span> - Bill failed in committee
              </li>
              <li>
                <span className="text-oxblood">Dead</span> - Bill did not pass
              </li>
              <li>
                <span className="text-navy">Passed House/Senate</span> - Bill passed chamber
              </li>
            </ul>
            <p className="mt-2 text-sm text-muted">
              <span className="font-semibold text-navy">Enacted</span> - Date the governor
              signed the bill into law (post-2016: the &quot;Signed Act&quot; version on the CO GA
              bill page; pre-2016: the signing note in the archived bill text).
            </p>
          </div>
        </div>
      </section>
    </ContentShell>
  );
}

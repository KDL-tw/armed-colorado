/**
 * Apply pre-2016 archive.leg.state.co.us research to the billwatch catalog.
 *
 * Source: a resolution table (one row per pre-2016 bill) produced by the
 * Wayback-archived CLICS "Title and Sponsors" bill-range list extraction
 * (see /tmp/pre2016/extract_lib.py). Each row carries:
 *   - readable: true  -> official short title from the archived CLICS list
 *                        + verified bill-text URL (archive.leg.state.co.us)
 *   - readable: false -> title kept as-is (no archived list capture); the
 *                        bill-text URL is the domain-swapped existing
 *                        officialUrl (www.leg.state.co.us -> archive.leg.state.co.us)
 *
 * Rules (mirror scripts/apply-official-titles.ts discipline):
 *   - Only pre-2016 entries (year < 2016) are touched.
 *   - readable rows: title := resolution.title, titleSource := "clics-archive",
 *     officialUrl := resolution.billTextUrl.
 *   - not-readable rows: title unchanged, titleSource := "rmgo-subject",
 *     officialUrl := resolution.billTextUrl (domain swap) when present.
 *   - Invariant: summary, sponsors, sponsorLinks, position, status,
 *     crsUrl, crsCitation, location, enactmentDate are byte-identical before
 *     and after (asserted at apply time).
 *   - Catalog written via saveCatalog (2-space JSON, matches existing format).
 *
 * Usage:
 *   npx tsx scripts/apply-pre2016-archive.ts --resolution <path> --report
 *   npx tsx scripts/apply-pre2016-archive.ts --resolution <path>
 */
import * as fs from "fs";
import * as path from "path";
import { saveCatalog } from "../src/lib/gun-bill/assemble-catalog";
import type { GunBillCatalogEntry, GunBillCatalogYear } from "../src/lib/gun-bill/types";

const CATALOG_FILE = path.join(process.cwd(), "data", "gun-bill-catalog-20260828.json");

interface ResolutionRow {
  billNumber: string;
  year: number;
  readable: boolean;
  title: string | null;
  titleSource: "clics-list" | "kept";
  billTextUrl: string | null;
  oldOfficialUrl: string | null;
}

/** Deep-freeze the invariant fields of an entry for before/after comparison. */
function invariants(e: GunBillCatalogEntry): string {
  return JSON.stringify({
    summary: e.summary,
    sponsors: e.sponsors,
    sponsorLinks: e.sponsorLinks,
    position: e.position,
    status: e.status,
    crsUrl: e.crsUrl,
    crsCitation: e.crsCitation,
    location: e.location,
    enactmentDate: e.enactmentDate,
  });
}

interface Report {
  applied: { billNumber: string; year: number; title: string; url: string; pass: "clics" | "url-swap" }[];
  kept: { billNumber: string; year: number; reason: string }[];
  counts: { clics: number; urlSwap: number; kept: number };
}

export function applyPre2016Archive(resolutionPath: string, write: boolean): Report {
  const catalog: GunBillCatalogYear[] = JSON.parse(fs.readFileSync(CATALOG_FILE, "utf8"));
  const resolution: ResolutionRow[] = JSON.parse(fs.readFileSync(resolutionPath, "utf8"));
  const resMap = new Map(resolution.map((r) => [`${r.billNumber}-${r.year}`, r]));

  const report: Report = { applied: [], kept: [], counts: { clics: 0, urlSwap: 0, kept: 0 } };

  for (const year of catalog) {
    if (year.year >= 2016) continue;
    for (const bill of year.bills) {
      const key = `${bill.billNumber}-${year.year}`;
      const res = resMap.get(key);
      if (!res) {
        report.kept.push({ billNumber: bill.billNumber, year: year.year, reason: "no resolution row" });
        continue;
      }
      const before = invariants(bill);
      if (res.readable && res.title) {
        bill.title = res.title;
        bill.titleSource = "clics-archive";
        if (res.billTextUrl) bill.officialUrl = res.billTextUrl;
        report.applied.push({ billNumber: bill.billNumber, year: year.year, title: res.title, url: res.billTextUrl || "", pass: "clics" });
        report.counts.clics++;
      } else {
        // not readable: keep title, set provenance, swap URL domain if available
        bill.titleSource = "rmgo-subject";
        if (res.billTextUrl) {
          bill.officialUrl = res.billTextUrl;
          report.applied.push({ billNumber: bill.billNumber, year: year.year, title: bill.title, url: res.billTextUrl, pass: "url-swap" });
          report.counts.urlSwap++;
        }
        report.kept.push({ billNumber: bill.billNumber, year: year.year, reason: "no archived list capture (title kept)" });
      }
      const after = invariants(bill);
      if (before !== after) {
        throw new Error(`Invariant violation on ${key}: summary/sponsors/position/status changed`);
      }
    }
  }

  if (write) {
    saveCatalog(catalog, CATALOG_FILE);
    console.log(`Wrote ${CATALOG_FILE}`);
  }
  return report;
}

/* CLI */
const args = process.argv.slice(2);
const doReport = args.includes("--report");
const resIdx = args.indexOf("--resolution");
if (resIdx === -1) {
  console.error("usage: apply-pre2016-archive.ts --resolution <path> [--report]");
  process.exit(1);
}
const resPath = args[resIdx + 1];
const r = applyPre2016Archive(resPath, !doReport);
console.log(JSON.stringify(r.counts, null, 2));
console.log(`applied: ${r.applied.length} (clics ${r.counts.clics}, url-swap ${r.counts.urlSwap}), kept: ${r.kept.length}`);
for (const a of r.applied) console.log(`  ${a.pass.toUpperCase()} ${a.year} ${a.billNumber}: ${a.title} -> ${a.url}`);
for (const k of r.kept) console.log(`  KEEP ${k.year} ${k.billNumber}: ${k.reason}`);

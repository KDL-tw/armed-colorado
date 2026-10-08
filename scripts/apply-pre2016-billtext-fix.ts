/**
 * Fix pre-2016 bill-text hyperlinks that 403/404 on archive.leg.state.co.us.
 *
 * Root cause: the live archive.leg.state.co.us server redirects
 * fsbillcont `<container>?Open&file=X.pdf` and preclics `.htm` URLs to
 * `archives.nsf/Accessible-Archive?OpenPage&content=...` which returns 403.
 *
 * Fixes (all URLs independently verified to serve the actual bill text):
 *   - 2001-2015 (93 bills): the Domino `$File` transform on www.leg.state.co.us
 *     serves the PDF directly:
 *       https://www.leg.state.co.us/<path>/<container>/$File/<file>?Open&bn=yes
 *     (verified: HTTP 200, application/pdf, %PDF magic bytes, per bill).
 *   - 2000 (16 bills): the 2000 inetcbill.nsf DB's fsbillcont path is
 *     auth-walled (Domino "Server Login"); the real PDFs live at
 *     `billcontainers/<container>/$FILE/<file>` and are served via Wayback
 *     raw-resource (`id_`) captures (verified: %PDF + bill-number text).
 *   - 1998-1999 (7 bills): preclics per-bill `.htm` pages are served via
 *     Wayback `id_` captures (verified: bill text present, no frame markers).
 *   - HB98-1260 (1998): NO working URL exists (per-bill page never archived,
 *     live 403). Its officialUrl is CLEARED so the bill number renders as
 *     plain text instead of a dead link (page.tsx skips the anchor when
 *     officialUrl is absent).
 *
 * Invariants (mirror scripts/apply-pre2016-archive.ts discipline):
 *   - Only pre-2016 entries (year < 2016) are touched.
 *   - Only `officialUrl` changes (plus the resolution file's billTextUrl).
 *   - summary, sponsors, sponsorLinks, position, status, crsUrl,
 *     crsCitation, location, enactmentDate, title, titleSource are
 *     byte-identical before and after (asserted at apply time).
 *   - No resulting URL contains '%20' (page.tsx renders such URLs as text).
 *   - Catalog written via saveCatalog (2-space JSON, matches existing format).
 *
 * Usage:
 *   npx tsx scripts/apply-pre2016-billtext-fix.ts --mapping <path> --report
 *   npx tsx scripts/apply-pre2016-billtext-fix.ts --mapping <path>
 */
import * as fs from "fs";
import * as path from "path";
import { saveCatalog } from "../src/lib/gun-bill/assemble-catalog";
import type { GunBillCatalogEntry, GunBillCatalogYear } from "../src/lib/gun-bill/types";

const CATALOG_FILE = path.join(process.cwd(), "data", "gun-bill-catalog-20260828.json");
const RESOLUTION_FILE = path.join(process.cwd(), "data", "pre2016-archive-resolution.json");

interface ResolutionRow {
  billNumber: string;
  year: number;
  titleReadableFromArchive: boolean;
  title: string | null;
  titleSource: string;
  billTextUrl: string | null;
  [k: string]: unknown;
}

/** Deep-freeze every field except officialUrl for before/after comparison. */
function invariants(e: GunBillCatalogEntry): string {
  const { officialUrl: _omit, ...rest } = e;
  return JSON.stringify(rest);
}

interface Report {
  updated: { billNumber: string; year: number; newUrl: string; pass: string }[];
  cleared: { billNumber: string; year: number; reason: string }[];
  untouched: { billNumber: string; year: number; reason: string }[];
  counts: { updated: number; cleared: number; untouched: number };
}

export function applyBillTextFix(mappingPath: string, write: boolean): Report {
  const catalog: GunBillCatalogYear[] = JSON.parse(fs.readFileSync(CATALOG_FILE, "utf8"));
  const mapping: Record<string, string> = JSON.parse(fs.readFileSync(mappingPath, "utf8"));
  const resolution: ResolutionRow[] = JSON.parse(fs.readFileSync(RESOLUTION_FILE, "utf8"));

  const report: Report = { updated: [], cleared: [], untouched: [], counts: { updated: 0, cleared: 0, untouched: 0 } };

  for (const year of catalog) {
    if (year.year >= 2016) continue;
    for (const bill of year.bills) {
      const key = `${bill.billNumber}-${year.year}`;
      const before = invariants(bill);
      const newUrl = mapping[key];
      if (newUrl) {
        if (newUrl.includes("%20")) {
          throw new Error(`URL for ${key} contains %20 — page.tsx would render it as plain text`);
        }
        bill.officialUrl = newUrl;
        report.updated.push({ billNumber: bill.billNumber, year: year.year, newUrl, pass: newUrl.startsWith("https://web.archive.org") ? "wayback" : "www-$File" });
        report.counts.updated++;
      } else {
        // No working URL exists (e.g. HB98-1260): clear the dead link.
        const oldUrl = bill.officialUrl;
        bill.officialUrl = undefined;
        report.cleared.push({ billNumber: bill.billNumber, year: year.year, reason: `no working URL (was: ${oldUrl})` });
        report.counts.cleared++;
      }
      const after = invariants(bill);
      if (before !== after) {
        throw new Error(`Invariant violation on ${key}: a field other than officialUrl changed`);
      }
    }
  }

  // Sanity: mapping keys must all resolve to catalog entries.
  const catalogKeys = new Set<string>();
  for (const year of catalog) {
    if (year.year >= 2016) continue;
    for (const bill of year.bills) catalogKeys.add(`${bill.billNumber}-${year.year}`);
  }
  const orphanKeys = Object.keys(mapping).filter((k) => !catalogKeys.has(k));
  if (orphanKeys.length) {
    throw new Error(`Mapping keys not found in catalog: ${orphanKeys.join(", ")}`);
  }

  // Update the resolution file's billTextUrl for every pre-2016 bill.
  // Use targeted string replacement (not full JSON re-serialization) so that
  // unrelated fields — including unicode-escaped titles like \u201c — keep
  // their exact original bytes. billTextUrl values are unique per bill, so
  // find-replace is unambiguous.
  let resText = fs.readFileSync(RESOLUTION_FILE, "utf8");
  let resReplaced = 0;
  let resCleared = 0;
  for (const r of resolution) {
    const key = `${r.billNumber}-${r.year}`;
    if (!catalogKeys.has(key)) continue;
    const newUrl = mapping[key];
    const oldLine = `"billTextUrl": ${JSON.stringify(r.billTextUrl)}`;
    if (!resText.includes(oldLine)) continue;
    const newLine = `"billTextUrl": ${newUrl ? JSON.stringify(newUrl) : "null"}`;
    resText = resText.replace(oldLine, newLine);
    if (newUrl) resReplaced++;
    else resCleared++;
  }

  if (write) {
    saveCatalog(catalog, CATALOG_FILE);
    console.log(`Wrote ${CATALOG_FILE}`);
    fs.writeFileSync(RESOLUTION_FILE, resText, "utf8");
    console.log(`Wrote ${RESOLUTION_FILE} (billTextUrl: ${resReplaced} replaced, ${resCleared} cleared)`);
  }
  return report;
}

/* CLI */
const args = process.argv.slice(2);
const doReport = args.includes("--report");
const mapIdx = args.indexOf("--mapping");
if (mapIdx === -1) {
  console.error("usage: apply-pre2016-billtext-fix.ts --mapping <path> [--report]");
  process.exit(1);
}
const mapPath = args[mapIdx + 1];
const r = applyBillTextFix(mapPath, !doReport);
console.log(JSON.stringify(r.counts, null, 2));
console.log(`updated: ${r.updated.length} (wayback ${r.updated.filter((u) => u.pass === "wayback").length}, www-$File ${r.updated.filter((u) => u.pass === "www-$File").length}), cleared: ${r.cleared.length}`);
for (const u of r.updated) console.log(`  ${u.pass} ${u.year} ${u.billNumber} -> ${u.newUrl}`);
for (const c of r.cleared) console.log(`  CLEAR ${c.year} ${c.billNumber}: ${c.reason}`);

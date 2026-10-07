/**
 * Replace billwatch catalog titles with the official CO GA long title
 * ("Concerning …") from the local bill-text cache, and/or from a
 * research findings file (pre-2016 bills, no live CO GA pages).
 *
 * Rules:
 *  - Catalog entries with a leg.colorado.gov URL: title := cached
 *    coGaLongTitle (field preserved on the cache entry). Skipped with a
 *    log line if the cache entry is missing, the long title fails
 *    validation, or the cache key's bill number differs from the entry's
 *    billNumber (data-quirk guard).
 *  - Research pass (only with --findings): pre-2016 entries whose
 *    billNumber has a findings entry with status "confirmed" and a
 *    valid long title; entry billNumber must equal findings billNumber.
 *  - titleSource is set accordingly; every other entry field is untouched.
 *  - Cache is never rewritten by this script (read-only here); a separate
 *    script owns cache writes.
 *
 * Usage:
 *   npx tsx scripts/apply-official-titles.ts --cached            (post-2015 from cache)
 *   npx tsx scripts/apply-official-titles.ts --findings /tmp/title-research-findings.json
 *   npx tsx scripts/apply-official-titles.ts --report            (print only, no write)
 */
import * as fs from "fs";
import * as path from "path";
import { loadBillTextCache } from "../src/lib/gun-bill/bill-text-cache";
import { saveCatalog } from "../src/lib/gun-bill/assemble-catalog";
import type { GunBillCatalogYear } from "../src/lib/gun-bill/types";

const CATALOG_FILE = path.join(process.cwd(), "data", "gun-bill-catalog-20260828.json");

/** Official long-title validation: must look like a CO GA long title.
 *  Accepted forms:
 *   - "Concerning …" / "An Act concerning …" (standard bills)
 *   - "Submitting to the registered electors … an amendment … concerning …"
 *     (amendments referred to voters, e.g. HCR22-1002, HJR bills)
 *  Upper bound 800: HB24-1349's full official title is 694 chars —
 *  the plan's 600 bound was calibrated before that entry was inspected.
 */
export function isValidLongTitle(t: string): boolean {
  const s = t.trim();
  return (
    s.length >= 15 &&
    s.length <= 800 &&
    /^(Concerning|An Act concerning|Submitting to the registered electors)/i.test(s)
  );
}

/** Extract the bill number from a leg.colorado.gov bill page URL. */
export function billNumberFromUrl(url: string): string | null {
  const m = url.match(/\/bills\/([A-Z]{1,3}\d{2}-\d+)$/i);
  return m ? m[1].toUpperCase() : null;
}

interface Findings {
  [billNumber: string]: {
    status: "confirmed" | "not_found" | "ambiguous";
    longTitle?: string;
    sourceUrl?: string;
    sourceNote?: string;
  };
}

export interface ApplyReport {
  applied: { year: number; billNumber: string; newTitle: string; pass: "cache" | "research" }[];
  skipped: { year: number; billNumber: string; reason: string }[];
  counts: { cached: number; research: number; skipped: number };
}

export function applyTitles(opts: {
  cached?: boolean;
  findingsPath?: string;
  write?: boolean;
}): ApplyReport {
  const catalog: GunBillCatalogYear[] = JSON.parse(
    fs.readFileSync(CATALOG_FILE, "utf8")
  );
  const cache = loadBillTextCache();
  let findings: Findings | undefined;
  if (opts.findingsPath) {
    findings = JSON.parse(fs.readFileSync(opts.findingsPath, "utf8")) as Findings;
  }
  const report: ApplyReport = { applied: [], skipped: [], counts: { cached: 0, research: 0, skipped: 0 } };

  for (const year of catalog) {
    for (const bill of year.bills) {
      const url = bill.officialUrl || "";
      const isLivePage = url.startsWith("https://leg.colorado.gov/bills/");

      if (opts.cached && isLivePage && !url.includes("%20")) {
        const data = cache.get(url);
        if (!data) {
          if (opts.write !== false) bill.titleSource = bill.titleSource || "rmgo-subject";
          report.skipped.push({ year: year.year, billNumber: bill.billNumber, reason: "no cache entry" });
          continue;
        }
        const entry = JSON.parse(data) as { coGaLongTitle?: string };
        const longTitle = (entry.coGaLongTitle || "").trim();
        if (!isValidLongTitle(longTitle)) {
          if (opts.write !== false) bill.titleSource = bill.titleSource || "rmgo-subject";
          report.skipped.push({ year: year.year, billNumber: bill.billNumber, reason: `invalid long title: ${JSON.stringify(longTitle.slice(0, 40))}` });
          continue;
        }
        const urlBill = billNumberFromUrl(url);
        if (urlBill && urlBill !== bill.billNumber.toUpperCase()) {
          if (opts.write !== false) bill.titleSource = bill.titleSource || "rmgo-subject";
          report.skipped.push({ year: year.year, billNumber: bill.billNumber, reason: `URL bill number mismatch (${urlBill})` });
          continue;
        }
        if (bill.title !== longTitle) {
          if (opts.write !== false) bill.title = longTitle;
          bill.titleSource = "co-ga-official";
        }
        report.applied.push({ year: year.year, billNumber: bill.billNumber, newTitle: longTitle, pass: "cache" });
        report.counts.cached++;
        continue;
      }

      if (findings && !isLivePage && bill.billNumber in findings) {
        const f = findings[bill.billNumber];
        if (f.status === "confirmed" && f.longTitle && isValidLongTitle(f.longTitle)) {
          if (bill.title !== f.longTitle.trim()) {
            if (opts.write !== false) bill.title = f.longTitle.trim();
            bill.titleSource = "co-ga-official";
          }
          report.applied.push({ year: year.year, billNumber: bill.billNumber, newTitle: f.longTitle.trim(), pass: "research" });
          report.counts.research++;
        } else {
          if (opts.write !== false) bill.titleSource = bill.titleSource || "rmgo-subject";
          report.skipped.push({ year: year.year, billNumber: bill.billNumber, reason: `research ${f.status}` });
          report.counts.skipped++;
        }
      } else if (opts.write !== false && !bill.titleSource) {
        bill.titleSource = "rmgo-subject";
      }
    }
  }

  if (opts.write !== false) {
    saveCatalog(catalog, CATALOG_FILE);
    console.log(`Wrote ${CATALOG_FILE}`);
  }
  return report;
}

/* CLI */
const args = process.argv.slice(2);
const doCached = args.includes("--cached");
const doFindings = args.includes("--findings");
const doReport = args.includes("--report");
if (doCached || doFindings) {
  const findingsPath = doFindings ? args[args.indexOf("--findings") + 1] : undefined;
  const r = applyTitles({ cached: doCached, findingsPath, write: !doReport });
  console.log(JSON.stringify(r.counts, null, 2));
  console.log(`applied: ${r.applied.length}, skipped: ${r.skipped.length}`);
  for (const s of r.skipped) console.log(`  SKIP ${s.year} ${s.billNumber}: ${s.reason}`);
}

/**
 * Build sponsor-links script — populates sponsorLinks on the catalog.
 *
 * Usage: npx tsx scripts/build-sponsor-links.ts [--limit N]
 * --limit N: processes only the first N live-URL bills (for quick testing).
 *
 * Reads: data/gun-bill-catalog-20260828_013008.json
 * Writes: data/gun-bill-catalog-20260828_013008.json (adds sponsorLinks to each entry)
 */

import * as fs from "fs";
import * as path from "path";
import {
  extractCoGaSponsorLinks,
  splitSponsorString,
} from "../src/lib/gun-bill/sponsor-links";
import type { GunBillCatalogYear } from "../src/lib/gun-bill/types";

const CATALOG_FILE = path.join(
  process.cwd(),
  "data",
  "gun-bill-catalog-20260828_013008.json"
);

// --limit N processes only the first N live-URL bills (for quick testing)
const limitIdx = process.argv.indexOf("--limit");
const LIMIT = limitIdx !== -1 ? parseInt(process.argv[limitIdx + 1], 10) : null;

async function main() {
  const catalog = JSON.parse(
    fs.readFileSync(CATALOG_FILE, "utf8")
  ) as GunBillCatalogYear[];

  let processed = 0;
  let linked = 0;
  let plain = 0;

  outer: for (const year of catalog) {
    for (const bill of year.bills) {
      const hasLiveUrl =
        !!bill.officialUrl && bill.officialUrl.includes("leg.colorado.gov/bills/");

      if (hasLiveUrl) {
        const links = await extractCoGaSponsorLinks(bill.officialUrl!, bill.sponsors);
        bill.sponsorLinks = links;
        processed++;
        const ok = links.filter((l) => l.slug).length;
        linked += ok;
        plain += links.length - ok;
        process.stdout.write(`  ${bill.billNumber}: ${ok}/${links.length} linked\n`);
        if (LIMIT && processed >= LIMIT) break outer;
      } else {
        // Pre-2016 / no live CO GA page: plain text only (Assumption A1)
        bill.sponsorLinks = bill.sponsors
          .flatMap(splitSponsorString)
          .map((name) => ({ name, slug: null }));
      }
    }
  }

  fs.writeFileSync(CATALOG_FILE, JSON.stringify(catalog, null, 2), "utf8");
  console.log(
    `\nDone. ${processed} live-URL bills processed. ` +
      `${linked} sponsor links resolved, ${plain} plain-text.`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

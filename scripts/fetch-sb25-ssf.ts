/**
 * Fetch the FDD "Specified Semiautomatic Firearms Guidance" PDF, extract text
 * with pdftotext -layout, parse into the living list, and write
 * data/sb25/ssf.json. Run: `npx tsx scripts/fetch-sb25-ssf.ts`.
 *
 * Requires pdftotext on PATH (poppler-utils). On the server, ensure
 * `apt-get install -y poppler-utils`.
 */
import { execSync } from "node:child_process";
import { writeFileSync, mkdirSync, readFileSync, existsSync, statSync } from "node:fs";
import path from "node:path";
import { parseSsfText } from "../src/lib/sb25/ssf-parser";
import { stampFreshness } from "../src/lib/data/data-stamp";
import { recordCheck } from "../src/lib/data/check-record";

const GUIDANCE_URL =
  "https://sbg.colorado.gov/sites/sbg/files/documents/Specified_Semiautomatic_Firearms_Guidance_07.30.2026.pdf";

function pdfVersion(url: string): string {
  const m = url.match(/Guidance_([\d.]+)\.pdf/);
  return m ? m[1].replace(/\./g, "/") : "unknown";
}

const tmp = path.join(process.cwd(), ".cache", "sb25", "ssf-guidance.pdf");
const tmpText = path.join(process.cwd(), ".cache", "sb25", "ssf-guidance.txt");
mkdirSync(path.dirname(tmp), { recursive: true });

const force = process.argv.includes("--force");
if (existsSync(tmp) && statSync(tmp).size > 0 && !force) {
  console.error("using cached PDF (re-download with --force): " + tmp);
} else {
  console.error("downloading " + GUIDANCE_URL);
  execSync(
    `curl -sSL --retry 3 --retry-delay 3 -A "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36" -o "${tmp}" "${GUIDANCE_URL}"`,
    { stdio: "inherit" },
  );
}

console.error("extracting text (pdftotext -layout)");
execSync(`pdftotext -layout "${tmp}" "${tmpText}"`, { stdio: "inherit" });

const text = readFileSync(tmpText, "utf8");
const version = pdfVersion(GUIDANCE_URL);
const data = parseSsfText(text, GUIDANCE_URL, version);

const OUT = path.join(process.cwd(), "data", "sb25", "ssf.json");
let prev: unknown = null;
try {
  prev = JSON.parse(readFileSync(OUT, "utf8"));
} catch {
  /* first run — no previous file */
}

// Freshness stamps + no-op discipline: same PDF re-parsed → write NOTHING
// (no dirty tree, no no-op commit).
const stamps = stampFreshness(prev, data);
console.error(`parsed ${data.counts.total} firearms (r=${data.counts.rifle} s=${data.counts.shotgun} h=${data.counts.handgun})`);
if (!stamps.changed) {
  recordCheck(["data/sb25/ssf.json"], "up-to-date");
  console.error("UP-TO-DATE: SSF content unchanged — no file written, nothing to commit.");
  process.exit(0);
}
Object.assign(data, stamps);
writeFileSync(OUT, JSON.stringify(data, null, 2) + "\n");
recordCheck(["data/sb25/ssf.json"], "updated");
console.error("wrote data/sb25/ssf.json");

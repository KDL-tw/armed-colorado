/**
 * SSF list freshness updater.
 *
 * Discovers the LATEST FDD "Specified Semiautomatic Firearms Guidance" PDF from
 * the FDD page, compares it with the committed data/sb25/ssf.json, and — if a
 * newer version exists — re-downloads + re-parses + rewrites ssf.json (and the
 * "official list PDF" source link in process.json), then commits + pushes. If
 * the committed list is already the latest, it prints UP-TO-DATE and exits 0
 * with no writes.
 *
 * Run:    npx tsx scripts/check-sb25-ssf.ts
 * Requires: curl, pdftotext (poppler-utils), git push creds.
 * Paired with scripts/ssf-monitor.sh (a cheap daily change-detector that only
 * wakes the agent when FDD publishes a new version).
 */
import { execSync } from "node:child_process";
import { writeFileSync, mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { parseSsfText } from "../src/lib/sb25/ssf-parser";

const FDD_PAGE = "https://sbg.colorado.gov/firearms-dealer-division";
const UA =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";

function run(cmd: string): string {
  return execSync(cmd, { stdio: "pipe" }).toString().trim();
}

/** Every guidance-PDF URL on the FDD page, deduped. */
function guidanceUrls(html: string): string[] {
  const re =
    /https:\/\/sbg\.colorado\.gov\/sites\/sbg\/files\/documents\/Specified_Semiautomatic_Firearms_Guidance_[0-9]{1,2}\.[0-9]{1,2}\.[0-9]{4}\.pdf/g;
  return [...new Set(html.match(re) ?? [])];
}

/** Newest guidance URL by embedded MM.DD.YYYY date (or null when none found). */
function latestGuidanceUrl(html: string): string | null {
  const urls = guidanceUrls(html);
  if (urls.length === 0) return null;
  const key = (u: string): string => {
    const m = u.match(/Guidance_([0-9]{1,2})\.([0-9]{1,2})\.([0-9]{4})\.pdf/);
    return m ? `${m[3]}${m[1].padStart(2, "0")}${m[2].padStart(2, "0")}` : "";
  };
  return [...urls].sort((a, b) => key(a).localeCompare(key(b))).pop() ?? null;
}

const html = run(`curl -sSL --retry 2 --max-time 30 -A "${UA}" "${FDD_PAGE}"`);
const latestUrl = latestGuidanceUrl(html);
if (!latestUrl) {
  console.error(
    "check-sb25-ssf: no guidance PDF found on the FDD page. Did the list move? Nothing changed.",
  );
  process.exit(2);
}

const ssfPath = path.join(process.cwd(), "data", "sb25", "ssf.json");
const current = JSON.parse(readFileSync(ssfPath, "utf8")) as {
  sourceUrl: string;
  version: string;
  counts: { total: number };
};

if (current.sourceUrl === latestUrl) {
  console.log(
    `UP-TO-DATE version=${current.version} total=${current.counts.total} source=${latestUrl}`,
  );
  process.exit(0);
}

// A newer version exists — re-fetch, re-parse, re-write.
const verMatch = latestUrl.match(/Guidance_([0-9]{1,2})\.([0-9]{1,2})\.([0-9]{4})\.pdf/)!;
const versionStr = `${verMatch[1]}/${verMatch[2]}/${verMatch[3]}`; // MM/DD/YYYY
const pdfPath = path.join(process.cwd(), ".cache", "sb25", "ssf-guidance.pdf");
const txtPath = path.join(process.cwd(), ".cache", "sb25", "ssf-guidance.txt");
mkdirSync(path.dirname(pdfPath), { recursive: true });

console.error(
  `check-sb25-ssf: newer guidance detected (${versionStr} vs committed ${current.version}). Downloading + parsing.`,
);
run(`curl -sSL --retry 3 --retry-delay 3 -A "${UA}" -o "${pdfPath}" "${latestUrl}"`);
run(`pdftotext -layout "${pdfPath}" "${txtPath}"`);
const text = readFileSync(txtPath, "utf8");
const data = parseSsfText(text, latestUrl, versionStr);
writeFileSync(ssfPath, JSON.stringify(data, null, 2) + "\n");
console.error(
  `check-sb25-ssf: wrote data/sb25/ssf.json (${data.counts.total} firearms; was ${current.counts.total}).`,
);

// Keep the committed "official list PDF" source link in process.json in sync.
const procPath = path.join(process.cwd(), "data", "sb25", "process.json");
const proc = JSON.parse(readFileSync(procPath, "utf8")) as {
  links: { sbg: { label: string; url: string }[] };
};
const link = proc.links.sbg.find((l) => /Guidance_.*\.pdf$/.test(l.url));
if (link) link.url = latestUrl;
writeFileSync(procPath, JSON.stringify(proc, null, 2) + "\n");

// Commit + push the refreshed list.
run("git add data/sb25/ssf.json data/sb25/process.json");
run(`git commit -m "data(sb25): refresh SSF list to ${versionStr} (${data.counts.total} firearms)"`);
run("git push origin main");
console.log(
  `UPDATED version=${versionStr} total=${data.counts.total} (was ${current.version}/${current.counts.total}); committed + pushed to origin/main.`,
);

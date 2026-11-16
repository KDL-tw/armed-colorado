import type { SsfCategory, SsfData, SsfFirearm } from "./types";

/**
 * Parse the `pdftotext -layout` output of the FDD "Specified Semiautomatic
 * Firearms Guidance" PDF into a structured living list.
 *
 * Entry rule (verified against the real 07/30/2026 extract): a firearm is each
 * run of consecutive non-blank "meaningful" lines; line-wrapping joins (e.g.
 * "ALEXANDER ARMS - .17 HMR STANDARD" + "RIFLE" → one entry). Category is the
 * most recent section heading; the ADDENDUM marker tags subsequent entries.
 *
 * Strip-before-group (each acts as a separator → flushes the current entry):
 * blank lines, form-feed page breaks, bare page numbers, the 2-line footer
 * sentence, and the section headings themselves. Before the first heading
 * `category` is null, so intro/cover prose is discarded.
 */
const RIFLES = /^\s*SEMIAUTOMATIC RIFLES WITH DETACHABLE MAGAZINES\s*$/;
const SHOTGUNS = /^\s*SEMIAUTOMATIC SHOTGUNS WITH DETACHABLE MAGAZINES\s*$/;
const PISTOLS = /^\s*SEMIAUTOMATIC GAS-OPERATED PISTOLS WITH DETACHABLE MAGAZINES\s*$/;
const ADDENDUM = /^\s*ADDENDUM\s*$/;
const FOOTER_A = /photographs are examples only/i;
const FOOTER_B = /^(in )?the series\.?$/i;
const PAGE_NUM = /^\d{1,3}$/;

/** Known non-firearm note lines the FDD PDF emits (document-format specific). */
const NOISE = [/semiautomatic models only/i];

function isNoise(name: string): boolean {
  return NOISE.some((re) => re.test(name));
}

/** A prose sentence (the addendum's intro paragraph) has many all-lowercase
 *  words; a MAKE - MODEL identifier has at most a few (e.g. "9mm", "Semi-Auto").
 *  >= 4 all-lowercase words (length >= 3) reliably flags prose. */
function looksLikeProse(name: string): boolean {
  const lowerWords = name
    .split(/[^\p{L}]+/u)
    .filter((w) => w.length >= 3 && w === w.toLowerCase());
  return lowerWords.length >= 4;
}

export function parseSsfText(text: string, sourceUrl: string, version: string): SsfData {
  let category: SsfCategory | null = null;
  let inAddendum = false;
  const firearms: SsfFirearm[] = [];
  let current: string[] = [];

  const flush = () => {
    const name = current.join(" ").replace(/\s+/g, " ").trim();
    if (name && category) {
      firearms.push(inAddendum ? { name, category, inAddendum: true } : { name, category });
    }
    current = [];
  };

  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/\u000c/g, "").trim(); // strip form-feed, trim
    if (line === "") { flush(); continue; }
    // flush() runs BEFORE mutating state so a pending entry keeps the category
    // it was accumulated under (and pre-heading intro prose is dropped while
    // category is still null). Do not reorder this.
    if (RIFLES.test(line)) { flush(); category = "rifle"; continue; }
    if (SHOTGUNS.test(line)) { flush(); category = "shotgun"; continue; }
    if (PISTOLS.test(line)) { flush(); category = "handgun"; continue; }
    if (ADDENDUM.test(line)) { flush(); inAddendum = true; continue; }
    if (FOOTER_A.test(line) || FOOTER_B.test(line)) { flush(); continue; }
    if (PAGE_NUM.test(line)) { flush(); continue; }
    current.push(line);
  }
  flush();

  // Post-processing: drop prose sentences and known PDF notes, and dedupe
  // same-name+category repeats (the source lists a few models twice).
  const seen = new Set<string>();
  const cleaned = firearms.filter((f) => {
    if (looksLikeProse(f.name) || isNoise(f.name)) return false;
    const key = f.name + "\u0000" + f.category;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const counts = { rifle: 0, shotgun: 0, handgun: 0, total: 0 };
  for (const f of cleaned) { counts[f.category]++; counts.total++; }
  return { fetchedAt: new Date().toISOString(), sourceUrl, version, counts, firearms: cleaned };
}

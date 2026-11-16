import { Fragment } from "react";

/**
 * Hyperlink to a CRS (or federal) statute, pointing at the ACTUAL statute text.
 *
 * State (Colorado) citations link to Justia's Colorado Revised Statutes page for
 * that section — the URLs in CRS_JUSTIA_MAP are verified against Justia's own
 * index. Justia blocks bots (403 to curl) but loads fine in a browser, which is
 * the point. leg.colorado.gov hosts the codified CRS via LexisNexis with no
 * clean per-section URLs, and its sitewide search returns the *bills* that
 * reference a citation rather than the statute text — so it is only the
 * fallback for citations not yet in the map. Subsections like "(1)(d)(II)(B)"
 * are stripped for the lookup because the section page contains every
 * subsection of that section.
 *
 * `crsCitationsToLinks()` turns every "C.R.S. <citation>" occurrence inside a
 * prose string into a CrsLink (the rest stays plain text), so data-driven prose
 * can cite statutes and have them all be hyperlinked.
 */
const JUSTIA_CO = "https://law.justia.com/codes/colorado";

/** Verified Justia statute-page URLs, keyed by the bare section citation. */
const CRS_JUSTIA_MAP: Record<string, string> = {
  "18-12-101": `${JUSTIA_CO}/title-18/article-12/part-1/section-18-12-101/`,
  "18-12-116": `${JUSTIA_CO}/title-18/article-12/part-1/section-18-12-116/`,
  "18-12-202.7": `${JUSTIA_CO}/title-18/article-12/part-2/section-18-12-202-7/`,
  "24-35-122": `${JUSTIA_CO}/title-24/principal-departments/article-35/part-1/section-24-35-122/`,
};

/** Strip trailing subsection groups — "(1)", "(d)", "(II)(B)" — to the bare section. */
function baseCitation(c: string): string {
  return c.replace(/(?:\(\d{0,3}\)|\([A-Za-z]\)|\([IVXLCM]+\))+$/, "").trim();
}

function crsHref(citation: string, federal?: boolean): string {
  if (federal) {
    return `https://www.law.cornell.edu/uscode/text/18/${citation.replace("18 USC ", "")}`;
  }
  return (
    CRS_JUSTIA_MAP[baseCitation(citation)] ??
    `https://leg.colorado.gov/sitewide-search?q=${encodeURIComponent(citation)}`
  );
}

export function CrsLink({ citation, federal }: { citation: string; federal?: boolean }) {
  return (
    <a
      href={crsHref(citation, federal)}
      target="_blank"
      rel="noopener noreferrer"
      className="text-oxblood underline underline-offset-2 hover:text-oxblood-deep"
    >
      {federal ? citation : `C.R.S. ${citation}`}
    </a>
  );
}

const CRS_PROSE_RE =
  /C\.R\.S\.\s*((?:\d{1,2}-\d{1,3}-\d{1,4}(?:\.\d+)?)(?:\(\d{0,3}\)|\([A-Za-z]\)|\([IVXLCM]+\))*)/g;

/**
 * Turn every "C.R.S. <citation>" in `text` into a CrsLink; everything else is
 * returned as plain text. Returns a keyed ReactNode list (safe to render
 * directly inside an element).
 */
export function crsCitationsToLinks(text: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  CRS_PROSE_RE.lastIndex = 0;
  while ((m = CRS_PROSE_RE.exec(text))) {
    if (m.index > last) {
      out.push(<Fragment key={`t${last}`}>{text.slice(last, m.index)}</Fragment>);
    }
    out.push(<CrsLink key={`c${m.index}`} citation={m[1]} />);
    last = m.index + m[0].length;
  }
  if (last < text.length) {
    out.push(<Fragment key={`t${last}`}>{text.slice(last)}</Fragment>);
  }
  return out;
}

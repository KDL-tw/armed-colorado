/**
 * Hyperlink to a CRS (or federal) statute. CRS citations resolve to the
 * CGA sitewide search (leg.colorado.gov hosts the CRS text via
 * LexisNexis; direct section URLs 404). Federal citations resolve to
 * Cornell LII (uscode.house.gov's granuleid URL 404s — verified 2026-10-30).
 */
export function CrsLink({ citation, federal }: { citation: string; federal?: boolean }) {
  const href = federal
    ? `https://www.law.cornell.edu/uscode/text/18/${citation.replace("18 USC ", "")}`
    : `https://leg.colorado.gov/sitewide-search?q=${encodeURIComponent(citation)}`;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-oxblood underline underline-offset-2 hover:text-oxblood-deep"
    >
      {federal ? citation : `C.R.S. ${citation}`}
    </a>
  );
}

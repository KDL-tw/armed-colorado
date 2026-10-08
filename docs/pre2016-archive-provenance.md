# Pre-2016 Bill Titles & Bill-Text Links — Provenance

Date: 2026-10-08
Workplan: `prompts/pre2016-bill-info.md`

## What was done
For every pre-2016 gun bill in the Billwatch catalog, the official bill title and a
working hyperlink to the original bill text were sourced from the archived Colorado
Legislature CLICS "Title and Sponsors" bill-range list pages, and the Billwatch page's
Position column was removed.

## Source
The live `archive.leg.state.co.us` (where the CO GA "2015 and prior legislative
session information" page's "House & Senate Bills, Resolutions, and Memorials" links
resolve) sits behind a Cloudflare managed challenge that does not clear from this host
(verified with curl, a real CDP browser, and Crawl4AI). The **Wayback Machine holds
archived copies of the identical CLICS bill-range list pages** — same DOM (Bill # with
PDF href + "Title and Sponsors" column). Those archived pages are the authoritative
source used here (the same pages the human procedure in the workplan describes).

### Bill-range list page structure (CLICS, 2004–2015)
Each list row (`<TR>`) carries:
- **Bill # cell**: `<A HREF="<pdf-path>">HB09-1001.pdf</A>` — the bill-text link.
  The live URL is `https://archive.leg.state.co.us` + that PDF path.
- **Title and Sponsors cell**: `<FONT>Official Title<BR>Sponsors</FONT>` — the official
  short title (already Title-Cased as archived) + sponsors.

The "Select Bill Range" dropdown (workplan) is a Domino POST form
(`BillFolderHeaderFrameAll?OpenForm&Seq=1`, field `Range`); the resulting list view is
`csl.nsf/(bf-N)?OpenView&Count=…`. The CLICS view indices are **not stable across years**
(e.g. 2009: bf-1=House/bf-2=Senate; 2011: bf-2=Senate/bf-3=House), so each session's
views were mapped individually via the Wayback CDX index.

### preclics (1998, 1999)
Static HTML lists (`preclics/1999/hbills99.htm`, etc.). Columns:
Status | FN | Bill Number | (Senate Sponsor | House Sponsor) | Bill Titles.
1998 rows are `<TR>` with **no closing tag** and a malformed bill-id cell
(`>sb081</TD></TD>`); 1998 bill ids are lowercase (`hb1260`), 1999 are `HB99-1305`.
preclics pages have **no PDF links** — the per-bill page (`.htm`) is the bill text.

## Coverage (117 pre-2016 bills)
| Session | Archived list capture | Bills readable (official title) |
|---|---|---|
| 1998, 1999 | preclics static lists (full) | all |
| 2004 | first-range only (House 1001–1050, Senate 001–050) | partial |
| 2005, 2006 | none | 0 |
| 2007–2010 | first-range only (Count=50) | partial |
| 2011–2015 | full-session (Count=20000000) | all |

**61 bills** have an official CLICS title applied (`titleSource: "clics-archive"`).
**56 bills** have no archived list capture (title kept as the existing RMGO subject,
`titleSource: "rmgo-subject"`); per the workplan these are listed in
`data/pre2016-not-readable-titles.json`.

## Bill-text hyperlinks
All 117 pre-2016 bill numbers now hyperlink to `archive.leg.state.co.us`:
- 109 → direct bill PDF (`…/fsbillcont3/<container>?Open&file=NNNN_*.pdf`), the PDF
  file number verified to match the bill number.
- 8 → preclics per-bill page (1998/1999, where the `.htm` page is the bill text).
The previous `officialUrl`s pointed at `www.leg.state.co.us` (now 403/Cloudflare) and a
few were wrong-container (e.g. HB11-1205 → SB12-025's container); all replaced.

## Files
- `data/pre2016-archive-resolution.json` — full resolution table (per bill: title,
  titleSource, billTextUrl, readability).
- `data/pre2016-readable-titles.json` — the 61 bills whose official title was read.
- `data/pre2016-not-readable-titles.json` — the 56 bills whose title was kept.
- `data/pre2016-extracted/year-YYYY.json` — raw per-year extraction output.
- `scripts/apply-pre2016-archive.ts` — the apply script (invariant-checked).

## Verification
- `npx tsc --noEmit`, `npm run lint` (0 errors), `npm run build` — pass.
- Production render (`npm run preview` + curl): 257 displayed rows, **0** "Position"
  in output, all 117 pre-2016 bill numbers anchored to `archive.leg.state.co.us`,
  0 `www.leg.state.co.us` links, official titles present.
- Invariant sweep: exactly 117 entries changed, only `title`/`titleSource`/`officialUrl`;
  summary/sponsors/sponsorLinks/position/status/crsUrl byte-identical; post-2016 entries
  untouched.
- Dead-link check: 116 of 117 bill-text URLs verified present in the Wayback
  archive (container + fsbillcont document confirmed per bill across all eras;
  the 2013/2012/2000–2004 bills initially flagged during the sweep were
  rate-limit false negatives, re-verified OK). The one remaining — HB98-1260's
  preclics per-bill page (`preclics/1998/hbills98/hb1260.htm`) — was never
  archived itself, but it is the exact link the archived 1998 list page
  (`preclics/1998/Hbills98.htm`) points at, so it is the canonical live URL.

## Gate examples from the workplan (verified)
- **Gate 1** — first 5 bills, 2009 session (archived CLICS2009A House list):
  HB09-1001 "Income Tax Credit For CO Job Growth", HB09-1002 "State Lottery
  Operations", HB09-1003 "Authorized Carrier Veh Sales Tax Exempt", HB09-1004 "PACE
  Organizations Employ Physicians", HB09-1005 "Spec Improvement Dist In Special Dist".
- **Gate 2** — History of HB04-1012: its `billsummary` document
  (`billsummary/CDF3312073988B1B87256DBB0079A6F5`) has **no archived snapshot** and the
  live copy is Cloudflare-walled, so it could not be read verbatim from this host.
  (History doc structure confirmed via an analogous archived billsummary, SJR04-023:
  "Summarized History for Bill Number …" with dated action lines.) Not fabricated.
- **Gate 3** — HB11-1205 bill-text URL:
  `https://archive.leg.state.co.us/CLICS/CLICS2011A/csl.nsf/fsbillcont3/15608113E583112C8725781E005F3120?Open&file=1205_ren.pdf`.

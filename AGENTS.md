<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:plan-crafting-principles -->
# Plan Crafting Principles

## 1. DOM Structure Verification Through Real Extraction
Verify DOM structure by examining real pages — never assumptions or documentation. Use `web_extract` to fetch actual page content and identify exact CSS selectors (e.g., `h1`, `h2:contains('Bill Summary:') + p`). Extraction logic must match the real structure, not an assumed one.

## 2. Cache Key Design with Full URLs
Use full URLs as cache keys: unique across bill pages, traceable to source, no ID mapping needed, no collisions. Store extracted data (ALL extracted fields — title, summary, sponsorLinks, …) as JSON objects keyed by URL in `.cache/bill-text/cache.json`; never write a cache entry that drops fields another task populated.

## 3. Graceful Degradation Pattern
New data sources (e.g., CO GA extraction) must fall back to existing data (e.g., RMGO): no data loss if extraction fails, continuous functionality during development, errors logged for debugging without breaking the user experience.

## 4. Error Handling with Data Validation
Browser automation and scraping must include: try/catch for network/browser errors, data validation after extraction (e.g., title empty or equal to the bill number = failure), fallback to alternative data sources, failure logging that does not disrupt the main flow.

## 5. Responsive Table Layout (critical bug lesson)
- `table-auto` (NOT `table-fixed`) so the browser sizes columns to the container; light width hints (`w-20`, `w-32`) for short columns (Position, Status, Bill Number); auto-width (no width class) for long content columns (Title, Summary); `whitespace-normal` on summary cells so text wraps; container width must be >= sum of minimum column widths; use `max-w-screen-2xl` for table-heavy pages.
- NEVER use `min-width` on table columns inside `overflow-x-auto` divs — this caused a critical bug where only 1-2 rows rendered in remote browsers (29 such divs each holding a 1280px table in a 576px container broke the layout engine).

## 6. DOM Structure Documentation
When working with external websites, document the exact DOM structure used for extraction: CSS selectors for each data point, example URLs where the structure was verified, and any differences between pages or sections.

## 7. Cache Structure Design
Cache files use JSON with a clear key-value structure (URL → extracted data), multiple data points (title, summary, sponsorLinks, …) embedded per entry, simple read/write helper functions, and error handling for corrupted files.

## 8. Rollback Procedures in Plans
Every implementation plan must include: specific git checkout commands for reverting, file paths for manual recovery, cache clearing commands, backup procedures for data files, and clear identification of what each task changes.

## 9. Testing Strategy Integration
For each task, include: a manual testing checklist with specific URLs and expected results, automated commands (lint, build, `tsc --noEmit`), edge cases to test (mobile view, extraction failure, cache corruption), and success criteria that are verifiable without ambiguity.
<!-- END:plan-crafting-principles -->

<!-- BEGIN:verification-and-debugging-protocol -->
# Verification & Debugging Protocol

Derived from a real incident: a prior agent spent multiple fix cycles making cosmetic CSS changes (border opacity, text colors, font weights) to a page whose actual problem was a table layout engine failure. It never ran a single diagnostic command, listed verification steps it never executed, and declared success without confirmation. Do not repeat this.

## Root cause before any fix
- NEVER propose a fix without reproducing the symptom and isolating WHERE it breaks. Symptom-chasing (tweaking CSS when the report is "missing rows") is forbidden. "The data isn't showing" is a data/render/streaming issue, not a cosmetics issue. "Hard to see" and "not present" are different problems with opposite root causes.
- For "page renders wrong" reports, gather evidence at EVERY boundary BEFORE fixing:
  1. Server: `curl -s http://localhost:PORT/path -o /tmp/p.html`, then count elements (e.g., `rg -o '<tr' /tmp/p.html | wc -l`) and compare to expected.
  2. Network/LAN: `curl -s http://<LAN-IP>:PORT/path -o /tmp/n.html`, compare sizes with localhost. If they differ → transport/proxy issue.
  3. Browser: user hard-reloads (Ctrl+Shift+R) AND view-source to search for a late element. Do not assume CSS without proof.
- This 2-second curl-and-count diagnostic eliminates (or implicates) the server, the data, and the filter logic in one command. ALWAYS run at least one evidence-gathering command before proposing a fix. If you cannot run a command, state that explicitly and ask the user to run it. Do not guess. Form a single hypothesis grounded in evidence.
- For "content missing" reports specifically: FIRST check what the server sends (`curl | grep -c '<tr'`), THEN what the browser receives (LAN-IP curl, view-source), ONLY THEN consider CSS/visibility. Never assume "invisible" when "not rendered" is possible.

## Cosmetic vs structural — classify before touching CSS
| Report | Likely category | First investigation |
|--------|----------------|---------------------|
| "Borders are faint" | Cosmetic | Check CSS opacity values |
| "Text color is wrong" | Cosmetic | Check color classes |
| "Only 1-2 rows show" | Structural | `curl \| grep -c '<tr'` — are rows in the output? |
| "Page is blank" | Structural | Check server response, then JS errors |
| "Content overflows horizontally" | Layout | Check table width vs container width |
| "Rows disappear on scroll" | Layout/JS | Check for scroll handlers, virtualization |

Never apply cosmetic fixes to a structural problem, or structural fixes to a cosmetic problem. The investigation (not the fix) determines which category you are in.

## Dev mode is NOT production (Next 16)
`next dev` streams RSC and loads hundreds of async Turbopack chunks + HMR — it is NOT representative of what a remote browser renders, especially for large pages. For LAN/remote viewing and for confirming rendering bugs, run PRODUCTION: `npm run preview` (builds + serves on 0.0.0.0). Compare dev vs prod before concluding. This project binds dev to 0.0.0.0:3000 via `package.json` "dev"; LAN IP is 192.168.1.209.

## Table layout rules
Canonical rules live in plan-crafting-principles #5. Additionally: test table rendering on both localhost AND a remote/LAN browser before declaring success.

## Verify before claiming done
- Run `npx tsc --noEmit`, `npm run lint`, `npm run build` before declaring success.
- A verification step you list MUST be executed, or you must explicitly state why you cannot. "Pending Verification" items are TODOs, not achievements. Never claim unmeasured results (e.g., "visibility improved 5x").
- `npm run build` passing means the code compiles — it does NOT mean the bug is fixed. For rendering bugs, the only valid confirmation is the user's browser showing the correct result.
- State explicitly: "I verified X by running Y. I have NOT yet confirmed Z (requires your browser)." Do not conflate "build succeeds" with "bug is fixed" — they are independent facts.
<!-- END:verification-and-debugging-protocol -->

<!-- BEGIN:billwatch-data-pipeline -->
# Billwatch Data Pipeline

## Known project facts
- Catalog: `data/gun-bill-catalog-*.json`, 269 bills across 29 years (2026->1998).
  2016–2026 bills have live CO GA pages (~151); pre-2016 bills have NO live CO GA pages
  (leg.colorado.gov only serves 2016+), but 116 of 117 pre-2016 bills have working
  ARCHIVED bill-text URLs (see "Pre-2016 bill text" below) — the bill-number hyperlinks
  and the summaries both come from those. HB98-1260 (1998) is the one with no working
  URL (officialUrl cleared).
- Page `src/app/billwatch/page.tsx` is a SERVER component that reads the file directly via
  `src/lib/gun-bill/catalog-client.ts` (path is portable via `process.cwd()`).
- `/api/gun-bill-catalog` route exists for external use; the page does NOT use it (direct file read).
- The search/year-filter UI is wired via `src/app/billwatch/BillTableClient.tsx` (client component,
  attaches listeners to `#search-input`/`#year-filter`, filters `tr[data-search]`/`section[data-year]`).
- `scripts/assemble-catalog.ts` regenerates the catalog from RMGO scraped data + CO GA extraction.
  Run `npx tsx scripts/assemble-catalog.ts --year 2026` for a single-year sample.
  Run `npx tsx scripts/assemble-catalog.ts` for the full catalog.
  WARNING: the catalog file is SHARED by multiple features. A title-extraction regeneration once
  wiped the `sponsorLinks` populated by the sponsor-hyperlinks feature (2026-09-02 incident; fixed
  by caching links per URL, but regeneration still rewrites every entry). Any task that regenerates
  the catalog MUST verify `sponsorLinks` survived before committing.
- Sponsor-coverage invariant: any change to sponsor resolution must verify AGGREGATE coverage
  before claiming done — bills with live slugs must not fall below the baseline recorded in
  `.cache/regression-baselines.json` (auto-ratcheted upward by the regression-guard hook, which
  blocks "done" claims while an uncommitted catalog regresses it). A named fix (e.g. specific
  legislators) and the aggregate are BOTH acceptance criteria; verify both.
  Baseline 2026-09-04 (evening): 157 bills with live slugs / 419 live slugs / 269 rows.
  Source of truth for the Sponsors column (prime sponsors only): the CO GA bill page's
  `<h2>Prime Sponsors</h2>` tiles, fetched + cached per URL by
  `scripts/fetch-prime-sponsors.ts` (primes land in `.cache/bill-text/cache.json` entries —
  re-runs are cache-first, `--refresh` forces re-fetch; the cache entry format preserves
  title/summary). Pre-2016 bills have no live pages and keep RMGO's sponsors (fallback by
  design). `scripts/filter-prime-sponsors.ts` (the earlier RMGO-derived pass) is retained as
  a local surname/fuzzy matcher but is NOT the source of truth — RMGO lists sometimes include
  non-prime sponsors (HB20-1099: RMGO listed 10, CO GA lists 3 primes).

## Scratch-file rule (learned from the 2026-09-04 litter incident)
- One-off verification/diagnostic scripts go in `/tmp` (e.g. `/tmp/opencode/`), NEVER in the
  repo root or `data/`. Delete them when done. The repo root accumulated 18 throwaway
  `check_*`/`test_extract*` scripts in one session before this rule existed.
- Reusable pipeline utilities belong in `scripts/` with a doc comment and `npx tsx` usage line.
- The project has no test framework; verification = `npx tsc --noEmit`, `npm run lint`,
  `npm run build`, then `npm run preview` + curl counts (rows, anchors) on localhost AND
  the LAN IP before claiming rendering success.

## Data sources (do NOT mix up)
- RMGO billwatch: source of position, status, bill number, sponsors, and the bill URL.
  NOT the source of bill titles or summaries.
- CO GA bill page (https://leg.colorado.gov/bills/{billNumber}): ground truth for titles and bill text.
  (2016–2026 only — pre-2016 has no live pages.)
- CO GA bill summary (`.bill-summary-content`): reference only, must NOT be copied verbatim.

## Pre-2016 bill text (source of pre-2016 summaries + bill-number hyperlinks)
- Pre-2016 bills have NO live CO GA pages, so their text comes from ARCHIVES, not leg.colorado.gov:
  - 2001–2015 (93 bills): the Domino `$File` transform on www.leg.state.co.us serves the PDF
    directly: `https://www.leg.state.co.us/<path>/<container>/$File/<file>?Open&bn=yes`
    (verified HTTP 200, application/pdf, %PDF magic bytes, per bill).
  - 2000 (16 bills): the 2000 inetcbill.nsf fsbillcont path is auth-walled; the real PDFs live at
    `billcontainers/<container>/$FILE/<file>` and are served via Wayback raw-resource (`id_`)
    captures.
  - 1998–1999 (7 bills): preclics per-bill `.htm` pages served via Wayback `id_` captures.
  - HB98-1260 (1998): NO working URL exists (per-bill page never archived, live 403). Its
    officialUrl is CLEARED so the bill number renders as plain text.
- These URLs are the `officialUrl` field in the catalog (set by `scripts/apply-pre2016-billtext-fix.ts`).
  `page.tsx` renders the bill number as a `<Link>` to `officialUrl` when present and non-`%20`.
- Text extraction: `pdftotext -layout` for PDFs, regex HTML-strip for `.htm`. The operative
  "BILL FOR AN ACT ... CONCERNING" section is near the top; long bills keep their first ~15k chars.
- Pre-2016 SUMMARIES (2026-10-08): 116/117 bills now have 3-4 sentence summaries written from the
  extracted bill text (delegated to subagent batches, applied via `scripts/apply-bill-summaries.ts`).
  HB98-1260 keeps its 1-sentence stub (no bill text available).
- The `apply-bill-summaries.ts` validator requires 3-4 sentences for ALL bills (pre-2016 included)
  since the pre-2016 bill text became available — the old 1-2-sentence pre-2016 rule is retired.

## CO GA DOM selectors (verified 2026-08-28 and 2026-09-04 on https://leg.colorado.gov/bills/HB26-1126)
- Official title: `.full-bill-topic h1` (regex: `/<div class='full-bill-topic[^']*'>\s*<h1>\s*([\s\S]*?)\s*<\/h1>/`)
- Long title: `.bill-long-title`
- Bill number tag: `.bill-detail-bill-number-tag`
- CO GA summary (reference only): `.bill-summary-content` (regex: `/<div class='bill-summary-content'>([\s\S]*?)<\/div>/`)
- Prime Sponsors (verified 2026-09-04 via live curl): the page top has `<h2>Prime Sponsors</h2>`
  followed by prime sponsor tiles — each an `/legislators/{slug}` anchor containing
  `.prime-sponsor-name` (display name) with the chamber in a preceding `<p>` (e.g. "Representative").
  There is NO h3/h4 "Sponsors" section (a 2026-09-04 plan encoded that assumed structure and failed).
  The all-sponsors list (prime + sponsor + co-sponsor, ~37 anchors on HB26-1126) lives further down
  under `<p>Prime Sponsor</p>` / `<p>Sponsor</p>` / `<p>Co-Sponsor</p>` category labels.
  `extractPageSponsors()` in `src/lib/gun-bill/sponsor-links.ts` captures h2→next-section and
  extracts only prime anchors.
- Status badge: `.final-status-badge-* p`
- Most recent bill PDF: first `<a class="ext-link-pdf">` in `#bill-activity-bill-text` "All Versions" table
  -> relative `/bill_files/{id}/download` (resolve to https://leg.colorado.gov/bill_files/{id}/download)

## Cache structure
- Location: `.cache/bill-text/cache.json` (JSON object keyed by full bill URL).
- Each entry: `{ "title": "...", "summary": "...", "sponsorLinks": "...", "coGaSummaryRaw": "...", "coGaLongTitle": "..." }`
  (JSON-stringified within the cache Map; `sponsorLinks`, `coGaSummaryRaw`, `coGaLongTitle` are optional per
  entry — never write a cache entry that drops fields another task populated).
- Use `loadBillTextCache()` / `saveBillTextCache()` / `setCachedCoGaData(url, title, summary, sponsorLinks?)`.

## Bill summaries (spec, 2026-09-04)
- Content: ONLY what the bill does — mechanisms, scope, definitions, exemptions, penalties, and
  effect-timing ("takes effect upon enactment" is allowed; legislative outcome/status is not).
- Banned from summaries: bill numbers, the bill title verbatim, position language ("is a support/
  oppose/amend bill"), status phrases ("signed into law", "is currently", "status of"), and 2A opinion
  ("Second Amendment", "2A perspective", "firearm freedoms"). The Status column already shows status;
  the Title column already shows titles.
- Length: 3-4 sentences for ALL bills (2016-2026 live-page bills AND pre-2016 bills). Pre-2016
  bills now have archived bill text available (see "Pre-2016 bill text"), so they match the
  post-2016 3-4 sentence size. The old 1-2-sentence pre-2016 rule is retired. HB98-1260 (1998)
  is the single exception — no bill text exists, so it keeps a 1-sentence stub.
- Prose: original, informed by the reference material — never verbatim copies of the CO GA summary
  (the CO GA summary is reference only per "Data sources" below).
- Pipeline: `scripts/fetch-bill-summaries.ts` fetches + caches the raw reference per URL
  (`coGaSummaryRaw` + `coGaLongTitle`; cache-first, `--refresh` to force). LLM-written summaries are
  applied by `scripts/apply-bill-summaries.ts`, which machine-validates every entry against the bans
  above plus sentence count and length, writes the catalog `summary` field AND the cache `summary`
  field (so catalog regeneration preserves them), and supports a `year` field to disambiguate
  billNumbers duplicated across year groups (RMGO mis-listing: HB19-1022 exists in both 2019 and 2013).
- Fallbacks: `generate2ASummary()` / `generate2ASummaryFromCoGa()` emit neutral title-frame sentences
  ("Concerns ...") for uncached bills — never the old 2A-POV template (retired 2026-09-04).

## Graceful degradation (plan-crafting-principles #3)
- If CO GA extraction fails (network, parse, missing selector), fall back to RMGO subject for the title
  and the templated `generate2ASummary()` for the summary. Log the failure. Never lose a bill row.

## Hermes agent handoff (remaining work)
- CO GA title/summary extraction for 1998-2025 is DONE (2026-09-02): 139 cache entries, CO GA titles
  for the recoverable 2016-2026 bills. Do NOT re-run the full extraction — it regenerates the
  shared catalog file (see the WARNING in Known project facts above).
- Pre-2016 summaries are DONE (2026-10-08): 116/117 pre-2016 bills have 3-4 sentence summaries
  written from their archived bill text (see "Pre-2016 bill text"). HB98-1260 (1998) has no bill
  text and keeps a 1-sentence stub.
- Remaining: none for the summary pipeline. If a new pre-2016 bill needs a summary, extract its
  text from the archived URL (see "Pre-2016 bill text"), write a 3-4 sentence summary, and apply
  via `scripts/apply-bill-summaries.ts` (pass `year` to disambiguate duplicated billNumbers).
- Bounded execution: 72h max, 3h per-table timeout, 3 revision cycles max, escalate after 3 cycles.

## HTML entity decoding
- CO GA page titles may contain HTML entities (`&amp;`, `&lt;`, etc.).
- `extractCoGaBillTitle()` decodes these via `decodeHtmlEntities()`. Always decode extracted text.
<!-- END:billwatch-data-pipeline -->

<!-- BEGIN:debugging-anti-patterns -->
# Debugging Anti-Patterns

The five anti-patterns and core principles from the original incident write-up (symptom-chasing, conflating "invisible" with "not present", no boundary evidence, listing verification steps without running them, declaring success without user confirmation) are merged into the Verification & Debugging Protocol above. Follow that protocol.
<!-- END:debugging-anti-patterns -->

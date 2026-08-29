<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:plan-crafting-principles -->
# Plan Crafting Principles

When iterating on implementation plans, apply these high-level concepts to ensure thoroughness and successful execution:

## 1. DOM Structure Verification Through Real Extraction

When building browser automation workflows, **always verify DOM structure by实地 examining real pages** rather than relying on assumptions or documentation. Use `web_extract` to fetch actual page content and identify exact CSS selectors (e.g., `h1`, `h2:contains('Bill Summary:') + p`). This ensures extraction logic works with the actual website structure, not an assumed structure.

## 2. Cache Key Design with Full URLs

For data extraction and caching, use **full URLs as cache keys** because they provide:
- Uniqueness across different bill pages
- Traceability back to source URLs
- Simple implementation without additional ID mapping
- No risk of collisions between similar bills

Store extracted data (title, summary) as JSON objects keyed by URL in `.cache/bill-text/cache.json`.

## 3. Graceful Degradation Pattern

When implementing new data sources (e.g., CO GA extraction), **always provide fallback to existing data** (e.g., RMGO data). This pattern ensures:
- No data loss if extraction fails
- Continuous functionality during development
- Smooth transition when new sources are unstable
- Error logging for debugging without breaking user experience

## 4. Error Handling with Data Validation

Browser automation and scraping must include:
- Try/catch blocks for network/browser errors
- Data validation after extraction (e.g., check if title is empty or equals bill number)
- Fallback mechanisms that use alternative data sources
- Logging of failures for debugging without disrupting the main flow

## 5. Responsive Table Layout (updated after critical bug)

For table layouts with variable content, use:
- `table-auto` (NOT `table-fixed`) so the browser can size columns to fit the container
- Light width hints (`w-20`, `w-32`) for short columns (Position, Status, Bill Number)
- Auto-width (no width class) for long content columns (Title, Summary) so they flex
- `whitespace-normal` on summary cells so text wraps instead of forcing horizontal overflow
- Container width must be >= sum of minimum column widths; use `max-w-screen-2xl` for table-heavy pages
- **NEVER** use `min-width` on table columns inside `overflow-x-auto` divs — this caused a critical
  rendering bug where only 1-2 rows appeared in remote browsers (see verification-and-debugging-protocol)

## 6. DOM Structure Documentation

When working with external websites, **document the exact DOM structure** used for extraction:
- Provide CSS selectors for each data point
- Include example URLs where structure was verified
- Note any changes between pages or sections
- This documentation enables future maintenance and troubleshooting

## 7. Cache Structure Design

For cache files, use JSON format with:
- Clear key-value structure (URL → extractedData)
- Embed multiple data points (title, summary) in single cache entries
- Simple read/write operations via helper functions
- Error handling for corrupted cache files

## 8. Rollback Procedures in Plans

Every implementation plan must include:
- Specific git checkout commands for reverting changes
- File paths for manual recovery
- Cache clearing commands
- Backup procedures for data files
- Clear identification of what each task changes

## 9. Testing Strategy Integration

For each task, include:
- Manual testing checklist with specific URLs and expected results
- Automated testing commands (lint, build, tsc --noEmit)
- Edge cases to test (mobile view, extraction failures, cache corruption)
- Success criteria that are verifiable without ambiguity
<!-- END:plan-crafting-principles -->

<!-- BEGIN:verification-and-debugging-protocol -->
# Verification & Debugging Protocol

## Root cause before any fix
- NEVER propose a fix without reproducing the symptom and isolating WHERE it breaks.
  Symptom-chasing (e.g. tweaking CSS border opacity when the report is "missing rows")
  is forbidden. "The data isn't showing" is a data/render/streaming issue, not a cosmetics issue.
- For "page renders wrong" reports, gather evidence at EVERY boundary BEFORE fixing:
  1. Server: `curl -s http://localhost:PORT/path -o /tmp/p.html` then count elements
     (e.g. `rg -o '<tr' /tmp/p.html | wc -l`). Compare to expected.
  2. Network/LAN: `curl -s http://<LAN-IP>:PORT/path -o /tmp/n.html` and compare sizes
     with localhost. If they differ -> transport/proxy issue.
  3. Browser: ask the user to hard-reload (Ctrl+Shift+R) AND `view-source` to search for a
     late element. Do not assume CSS without proof.

## Dev mode is NOT production (Next 16)
- `next dev` streams RSC and loads hundreds of async Turbopack chunks + HMR. It is NOT
  representative of what a remote browser ultimately renders, especially for large pages.
- For LAN/remote viewing and for confirming rendering bugs, run PRODUCTION:
  `npm run preview` (builds + serves on 0.0.0.0). Compare dev vs prod before concluding.
- This project binds dev to 0.0.0.0:3000 via `package.json` "dev"; LAN IP is 192.168.1.209.

## Table layout rules
- NEVER use `table-fixed` with fixed pixel widths that exceed the container width.
  This caused a critical rendering bug where only 1-2 rows appeared in remote browsers
  because 29 `overflow-x-auto` divs each containing a 1280px table in a 576px container
  caused the browser layout engine to fail.
- Use `table-auto` with light width hints (w-20, w-32) for short columns and auto-width
  for long content columns. Use `max-w-screen-2xl` or wider for table-heavy pages.
- Test table rendering on both localhost AND a remote/LAN browser before declaring success.

## Verify before claiming done
- Run `npx tsc --noEmit`, `npm run lint`, `npm run build` before declaring success.
- For UI fixes, get explicit confirmation from the user's actual browser (hard-reload),
  not a server-side assumption. State what you verified and how.
<!-- END:verification-and-debugging-protocol -->

<!-- BEGIN:billwatch-data-pipeline -->
# Billwatch Data Pipeline

## Known project facts
- Catalog: `data/gun-bill-catalog-*.json`, 269 bills across 29 years (2026->1998); ~265 have valid URLs.
- Page `src/app/billwatch/page.tsx` is a SERVER component that reads the file directly via
  `src/lib/gun-bill/catalog-client.ts` (path is portable via `process.cwd()`).
- `/api/gun-bill-catalog` route exists for external use; the page does NOT use it (direct file read).
- The search/year-filter UI is wired via `src/app/billwatch/BillTableClient.tsx` (client component,
  attaches listeners to `#search-input`/`#year-filter`, filters `tr[data-search]`/`section[data-year]`).
- `scripts/assemble-catalog.ts` regenerates the catalog from RMGO scraped data + CO GA extraction.
  Run `npx tsx scripts/assemble-catalog.ts --year 2026` for a single-year sample.
  Run `npx tsx scripts/assemble-catalog.ts` for the full catalog (fetches all 269 bills from CO GA).

## Data sources (do NOT mix up)
- RMGO billwatch: source of position, status, bill number, sponsors, and the bill URL.
  NOT the source of bill titles or summaries.
- CO GA bill page (https://leg.colorado.gov/bills/{billNumber}): ground truth for titles and bill text.
- CO GA bill summary (`.bill-summary-content`): reference only, must NOT be copied verbatim.

## CO GA DOM selectors (verified 2026-08-28 on https://leg.colorado.gov/bills/HB26-1126)
- Official title: `.full-bill-topic h1` (regex: `/<div class='full-bill-topic[^']*'>\s*<h1>\s*([\s\S]*?)\s*<\/h1>/`)
- Long title: `.bill-long-title`
- Bill number tag: `.bill-detail-bill-number-tag`
- CO GA summary (reference only): `.bill-summary-content` (regex: `/<div class='bill-summary-content'>([\s\S]*?)<\/div>/`)
- Prime Sponsors: `.prime-sponsor-block .prime-sponsor-tile` -> `.prime-sponsor-name` + preceding `<p>` (chamber)
- Status badge: `.final-status-badge-* p`
- Most recent bill PDF: first `<a class="ext-link-pdf">` in `#bill-activity-bill-text` "All Versions" table
  -> relative `/bill_files/{id}/download` (resolve to https://leg.colorado.gov/bill_files/{id}/download)

## Cache structure
- Location: `.cache/bill-text/cache.json` (JSON object keyed by full bill URL).
- Each entry: `{ "title": "...", "summary": "..." }` (JSON-stringified within the cache Map).
- Use `loadBillTextCache()` / `saveBillTextCache()` / `setCachedCoGaData(url, title, summary)`.
- 2026 bills (16) are cached as of 2026-08-28. Remaining 253 bills (1998-2025) need extraction.

## Graceful degradation (plan-crafting-principles #3)
- If CO GA extraction fails (network, parse, missing selector), fall back to RMGO subject for the title
  and the templated `generate2ASummary()` for the summary. Log the failure. Never lose a bill row.

## Hermes agent handoff (remaining work)
- The remaining 253 bills (1998-2025) require CO GA title + summary extraction.
- Run: `npx tsx scripts/assemble-catalog.ts` (will fetch all bills, using cache for 2026).
- For genuine 2A-POV summaries (not template-based), the hermes agent should use its LLM + browser
  tool to read bill PDFs and generate ≤4-sentence summaries per the prompts.
- Bounded execution: 72h max, 3h per-table timeout, 3 revision cycles max, escalate after 3 cycles.

## HTML entity decoding
- CO GA page titles may contain HTML entities (`&amp;`, `&lt;`, etc.).
- `extractCoGaBillTitle()` decodes these via `decodeHtmlEntities()`. Always decode extracted text.
<!-- END:billwatch-data-pipeline -->

<!-- BEGIN:debugging-anti-patterns -->
# Debugging Anti-Patterns & Core Principles

These principles were derived from a real incident where a prior agent spent multiple fix cycles
making cosmetic CSS changes (border opacity, text colors, font weights) to a page where the actual
problem was a table layout engine failure. The agent never ran a single diagnostic command, listed
verification steps it never executed, and declared success without confirmation. Do not repeat this.

## Anti-Pattern 1: Symptom-chasing without root cause investigation

**The failure:** The report was "only 1-2 entries visible instead of 265 bills." The agent assumed
the rows were present but invisible, and tweaked border opacity from `/10` to `/50`, added explicit
text colors to every cell, and added `font-semibold` to headers. None of these addressed the actual
problem (a table layout engine failure from extreme width overflow).

**The rule:** Before proposing ANY fix, you MUST:
1. Reproduce the symptom and state it precisely: "the browser renders 1-2 rows, not 265"
2. Isolate WHERE the failure occurs: server? network? browser? CSS? JS? data?
3. Gather evidence at each boundary (see verification-and-debugging-protocol)
4. Form a single hypothesis grounded in evidence, not assumption

If you catch yourself thinking "the borders are probably just too faint" when the report is "rows
are missing" — STOP. That is symptom-chasing. "Hard to see" and "not present" are different problems.

## Anti-Pattern 2: Conflating "invisible" with "not present"

**The failure:** The agent could not distinguish between:
- "The rows exist in the DOM but their borders/text are too faint to see" (a cosmetic issue)
- "The rows are not being rendered by the browser's layout engine" (a structural issue)

These require completely different investigations. The agent treated a structural failure as a
styling preference.

**The rule:** When a user reports "I can only see X rows" or "content is missing":
- FIRST check if the content exists in what the server sends (`curl -s URL | grep -c '<tr'`)
- THEN check if it exists in what the browser receives (network IP curl, view-source)
- ONLY THEN consider whether CSS/visibility is the issue
- Never assume "invisible" when "not rendered" is possible. They look identical to a user but
  have opposite root causes.

## Anti-Pattern 3: No boundary-level evidence gathering

**The failure:** The agent never ran a single `curl` command. It never inspected the prerendered
HTML. It never compared localhost vs network IP responses. It never checked if CSS contained
hiding rules. It operated entirely on assumption — the most expensive debugging method.

**The rule:** A single command would have redirected the entire investigation:
```bash
curl -s http://localhost:3000/billwatch | grep -c '<tr'
# Result: 283 — all rows ARE in the server output
# Conclusion: the problem is NOT the server or data. It's browser-side rendering.
```
ALWAYS run at least one evidence-gathering command before proposing a fix. If you cannot run
a command, state that explicitly and ask the user to run it. Do not guess.

## Anti-Pattern 4: Listing verification steps and then not running them

**The failure:** The agent's own BUGFIX_LOG contained a "Pending Verification" section with four
correct steps (hard reload, console check, API verification, check multiple years). It listed
these steps and then declared the fix complete without executing any of them.

**The rule:**
- If you list a verification step, you MUST execute it (or explicitly state why you cannot)
- "Pending Verification" items are not complete until verified — they are TODOs, not achievements
- Never claim "Result: border visibility improved 5x" without measuring it
- Never claim a fix works without confirmation from the actual environment where the bug occurs
- See verification-before-completion: evidence before assertions, always

## Anti-Pattern 5: Declaring success without user confirmation

**The failure:** The agent changed CSS, ran `npm run build` (which only confirms the code compiles,
not that the rendering bug is fixed), and declared success. The user still saw only 1-2 rows.

**The rule:**
- `npm run build` passing means the code compiles. It does NOT mean the bug is fixed.
- For rendering bugs, the ONLY valid confirmation is the user's browser showing the correct result.
- State explicitly: "I verified X by running Y. I have NOT yet confirmed Z (requires your browser)."
- Do not conflate "build succeeds" with "bug is fixed." They are independent facts.

## Core principle: Distinguish cosmetic from structural

Before touching any CSS, classify the reported problem:

| Report | Likely category | First investigation |
|--------|----------------|---------------------|
| "Borders are faint" | Cosmetic | Check CSS opacity values |
| "Text color is wrong" | Cosmetic | Check color classes |
| "Only 1-2 rows show" | Structural | `curl \| grep -c '<tr'` — are rows in the output? |
| "Page is blank" | Structural | Check server response, then JS errors |
| "Content overflows horizontally" | Layout | Check table width vs container width |
| "Rows disappear on scroll" | Layout/JS | Check for scroll handlers, virtualization |

Never apply cosmetic fixes to a structural problem. Never apply structural fixes to a cosmetic
problem. The investigation (not the fix) determines which category you're in.

## Core principle: The cheapest diagnostic is the most valuable

The single most effective diagnostic for "page renders wrong" is:
```bash
curl -s http://localhost:PORT/path -o /tmp/page.html
rg -o '<tr' /tmp/page.html | wc -l
```
This costs 2 seconds and tells you whether the server is the problem. If the count matches
expectations, you've eliminated the server, the data, and the filter logic in one command.
If it doesn't, you've found the problem is upstream of the browser.

ALWAYS run this before touching CSS, JavaScript, or component code.
<!-- END:debugging-anti-patterns -->

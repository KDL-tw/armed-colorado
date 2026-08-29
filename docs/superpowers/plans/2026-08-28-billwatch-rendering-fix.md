# Billwatch Rendering Fix & Data Quality Completion Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix `/billwatch` rendering on the remote browser (only 1-2 rows visible instead of 265), complete the cleanup-prompt requirements (table width, CO GA titles/summaries), wire up the dead search/filter UI, and harden the codebase + AGENTS.md.

**Architecture:** Diagnostic-first rendering fix (dev vs prod A/B test isolating whether dev-mode RSC streaming causes the symptom), then page cleanup rendering, then CO GA data extraction (opencode proves the pipeline on 2026's 16 bills via webfetch, hands off the remaining 253 to the hermes agent), then code hardening, then AGENTS.md.

**Tech Stack:** Next.js 16.2.12 (App Router, Turbopack dev), React 19.2.4, Tailwind v4, TypeScript 5, Node 20. Server Components read JSON catalog directly from `data/`. No playwright/puppeteer — browser extraction is the hermes agent's job; opencode uses `webfetch` for pipeline proof.

---

## Verified Facts (investigation completed before this plan)

| Boundary | Evidence | Verdict |
|---|---|---|
| Data file | `jq` over `data/gun-bill-catalog-20260828_013008.json`: 269 bills, 29 years; 265 have valid URLs (only 4 dropped by the page filter) | Data is present |
| Dev server | `curl localhost:3000/billwatch` → 283 `<tr>`, 1,025,501 bytes, all rows in HTML + RSC payload | Server renders all rows |
| LAN transport | `curl 192.168.1.209:3000/billwatch` → identical 1,025,501 bytes / 283 `<tr>` | Network is fine |
| Host identity | `ip addr` → this machine IS 192.168.1.209 | Remote truly hits this dev server |
| Assets | script/link `src`/`href` all relative `/_next/...` | Reachable remotely |
| CSS hiding | grep served HTML → no `display:none`/`hidden`/`max-height` | Not a CSS-hide issue |
| Cache | user hard-reload → still 1-2 rows | Not a stale cache issue |
| JS DOM manipulation | grep served HTML → no `querySelector`/`addEventListener`/`style.display`; search/filter IDs referenced only in markup, never in JS | Nothing removes rows |
| Row height | summary lengths 238-351 chars (avg 270) | Rows are small; not a giant-row issue |
| Prod prerender | `.next/server/app/billwatch.html` → 283 `<tr>` | Build output is correct |

**Conclusion before this plan:** The full 265-bill markup reaches the remote browser. The one variable not yet observed is the browser's rendering/hydration of this 1MB page in dev mode (403 async Turbopack chunks + RSC streaming + HMR). The A/B test (Task 1) settles this.

## CO GA DOM (verified by webfetch on https://leg.colorado.gov/bills/HB26-1126)

Per plan-crafting-principles #1 and #6, these selectors come from the real page, not assumptions:

- **Official title**: `.full-bill-topic h1` -> "Requirements for Firearms Dealers" (NOT the RMGO subject "Gun Shop Annihilation Act")
- **Long title**: `.bill-long-title` -> "Concerning requirements for dealing firearms."
- **Bill number tag**: `.bill-detail-bill-number-tag` -> "HB26-1126"
- **CO GA summary (must NOT copy)**: `.bill-summary-content p`
- **Prime Sponsors**: `.prime-sponsor-block .prime-sponsor-tile` -> each has `.prime-sponsor-name` and a preceding `<p>` (Representative/Senator)
- **Status badge**: `.final-status-badge-* p` -> "Became Law"
- **Most recent bill PDF**: first `<a class="ext-link-pdf">` inside `#bill-activity-bill-text` "All Versions" table -> `/bill_files/{id}/download`

## Prompt Requirements vs Current State

| Requirement | Status |
|---|---|
| Tables reverse-chrono 2026->1998, 29 years | DONE |
| Position colors (Support green, Oppose red, Amend blue) | DONE |
| Status colors (Signed into Law bold, Killed red) | DONE |
| Title hyperlinked to CO GA bill page | DONE |
| Sponsor list vertical (not comma-sequential) | DONE |
| Heading subtitle rewritten | DONE |
| Summaries displayed fully (no ellipses) | DONE |
| **Table width: "too narrow, widen for readability"** | GAP (table-fixed + min-w-[400px] forces horizontal scroll) |
| **Bill titles from CO GA (NOT RMGO)** | GAP (extractCoGaBillTitle() is a stub) |
| **Summaries from CO GA bill text (NOT RMGO, NOT copied from CO GA summary)** | GAP (extractCoGaBillSummary() is a stub; cache empty) |

---

## Task 1: Decisive diagnostic - production vs dev on the remote browser

**Files:** none modified.

- [ ] **Step 1: Build production**

Run: `npm run build`
Expected: `✓ Compiled successfully` and `/billwatch` listed as prerendered/static with 283 `<tr>`.

- [ ] **Step 2: Start production on the LAN**

Stop the dev server if it occupies port 3000, then run: `npx next start -H 0.0.0.0 -p 3000`
Expected: `Ready in ...s` bound to `0.0.0.0:3000`.

- [ ] **Step 3: User hard-reloads remotely**

User hard-reloads (Ctrl+Shift+R) `http://192.168.1.209:3000/billwatch` and reports row count.

- [ ] **Step 4: Record outcome and branch**
  - All 265 rows show -> root cause = dev-mode RSC streaming/hydration of the 1MB payload. Proceed to Task 2A.
  - Still 1-2 rows -> root cause = remote browser environment. Proceed to Task 2B.

---

## Task 2A: Fix - if production works (dev-mode streaming is the root cause)

**Files:** `package.json`

- [ ] **Step 1: Add LAN preview script**

```json
"preview": "next build && next start -H 0.0.0.0"
```

- [ ] **Step 2: Verify on remote browser via `npm run preview`**

Expected: all 265 rows render. This is the supported way to view remotely; dev mode is not representative (Next 16 streams RSC + loads hundreds of Turbopack chunks + HMR).

## Task 2B: Fix - if production ALSO shows 1-2 rows (browser-environmental)

**Files:** none code-side; requires minimal user action.

- [ ] **Step 1: view-source check**

User opens `view-source:http://192.168.1.209:3000/billwatch` and searches for a late bill (e.g. `SB26-004`). If present in source but not painted -> extension/proxy/service-worker is collapsing the DOM.

- [ ] **Step 2: Incognito test**

User tests in incognito with extensions disabled. If all rows appear -> identifies the offending extension.

- [ ] **Step 3: Service worker (only if registered)**

DevTools -> Application -> Service Workers -> Unregister. No code change.

---

## Task 3: Widen tables for readability; revert cosmetic CSS noise

**Files:** `src/app/billwatch/page.tsx`

The cleanup prompt says tables are "too narrow and makes reading difficult." The previous agent made this WORSE with `table-fixed` + `min-w-[400px]` forcing 1280px+ horizontal scroll.

- [ ] **Step 1: Switch to table-auto with proportional widths**

Replace `table-fixed` with `table-auto` and use `whitespace-normal` on summary cells so text wraps naturally within the column. Drop `min-w-[400px]` (it forces horizontal scroll). Keep the dedup/URL filter (lines 94-108) and `font-semibold` on headers.

- [ ] **Step 2: Revert cosmetic-only CSS noise**

Revert border opacity `/50`->`/20` (header), `/30`->`/10` (rows). Drop redundant per-cell `text-muted`/`text-blue-600`/`text-navy` (inheritance via the parent `text-navy` on body and span color classes was fine). Keep `font-semibold` on `<th>`.

- [ ] **Step 3: Verify lint + typecheck**

Run: `npx tsc --noEmit && npm run lint`
Expected: clean.

---

## Task 4: Wire up dead search/year-filter UI

**Files:** `src/app/billwatch/page.tsx`, Create: `src/app/billwatch/BillTableClient.tsx`

The `#search-input` / `#year-filter` / `#bill-tables-container` inputs have NO handler (verified: no JS references them). This is misleading UI. Wire them up per the intended UX.

- [ ] **Step 1: Add data attributes for filtering in page.tsx**

Add `data-year={yearData.year}` to each `<section>` and `data-search` (lowercased billNumber+title+summary) to each `<tr>` so the client filter is trivial and doesn't re-fetch data.

- [ ] **Step 2: Create BillTableClient.tsx**

```tsx
"use client";
import { useEffect } from "react";

export function BillTableClient() {
  useEffect(() => {
    const searchInput = document.getElementById("search-input") as HTMLInputElement | null;
    const yearFilter = document.getElementById("year-filter") as HTMLSelectElement | null;
    const sections = document.querySelectorAll<HTMLSectionElement>("#bill-tables-container section[data-year]");

    function applyFilter() {
      const q = (searchInput?.value || "").trim().toLowerCase();
      const year = yearFilter?.value || "";

      sections.forEach((section) => {
        const sectionYear = section.getAttribute("data-year") || "";
        const yearMatch = !year || sectionYear === year;
        if (!yearMatch) {
          section.style.display = "none";
          return;
        }
        let anyVisible = false;
        section.querySelectorAll<HTMLTableRowElement>("tbody tr[data-search]").forEach((row) => {
          const haystack = row.getAttribute("data-search") || "";
          const visible = !q || haystack.includes(q);
          row.style.display = visible ? "" : "none";
          if (visible) anyVisible = true;
        });
        section.style.display = anyVisible ? "" : "none";
      });
    }

    searchInput?.addEventListener("input", applyFilter);
    yearFilter?.addEventListener("change", applyFilter);
    return () => {
      searchInput?.removeEventListener("input", applyFilter);
      yearFilter?.removeEventListener("change", applyFilter);
    };
  }, []);

  return null;
}
```

- [ ] **Step 3: Import and render BillTableClient in page.tsx**

Add `<BillTableClient />` inside `<ContentShell>` (it renders null; just attaches listeners).

- [ ] **Step 4: Verify lint + typecheck + build**

Run: `npx tsc --noEmit && npm run lint && npm run build`
Expected: clean; `/billwatch` prerendered with 283 `<tr>`.

- [ ] **Step 5: Verify filtering works in browser**

Search "oppose" -> only rows containing "oppose" show. Pick year 2023 -> only that section shows. Clear filters -> all rows return.

---

## Task 5: Replace extractCoGaBillTitle() stub with real extraction

**Files:** `src/lib/gun-bill/extract-co-ga-bill-info.ts`, `scripts/assemble-catalog.ts`

The stub `console.warn`s and returns the bill number. Real extraction must use `.full-bill-topic h1`.

- [ ] **Step 1: Implement extractCoGaBillTitle with real HTML fetch**

Replace the stub body of `extractCoGaBillTitle` so it fetches the CO GA bill page and extracts `.full-bill-topic h1` text. Since this runs in Node (the assembly script), use `fetch` (Node 20 has global fetch) + a minimal regex/DOM-text extraction. Cache via `setCachedCoGaData`. Fall back to RMGO subject gracefully (plan-crafting-principles #3).

```typescript
export async function extractCoGaBillTitle(
  billNumber: string,
  billUrl: string
): Promise<string> {
  try {
    const res = await fetch(billUrl, { redirect: "follow" });
    if (!res.ok) {
      console.error(`HTTP ${res.status} fetching ${billUrl}`);
      return billNumber;
    }
    const html = await res.text();
    const m = html.match(/<div class='full-bill-topic[^']*'>\s*<h1>([^<]+)<\/h1>/);
    const title = m ? m[1].trim() : "";
    if (!title || title === billNumber) return billNumber;
    return title;
  } catch (error) {
    console.error(`Error extracting title from ${billUrl}:`, error);
    return billNumber;
  }
}
```

- [ ] **Step 2: Make scripts/assemble-catalog.ts reproducible**

Replace hardcoded relative path `'../data/rmgo-scraped-bills-20260828.json'` with `path.join(process.cwd(), "data", "rmgo-scraped-bills-20260828.json")`. Same for the output catalog path. Log progress per bill so the run is observable.

- [ ] **Step 3: Verify typecheck**

Run: `npx tsc --noEmit`
Expected: clean.

---

## Task 6: Replace extractCoGaBillSummary() stub; prove pipeline on 2026's 16 bills

**Files:** `src/lib/gun-bill/extract-co-ga-bill-info.ts`, `scripts/assemble-catalog.ts`

The cleanup prompt: summaries must come from the most recent bill version on CO GA, must NOT be copied from the CO GA website summary, must NOT come from RMGO, and must be <=4 sentences from a 2A advocate's POV. opencode proves the extraction pipeline on 2026's 16 bills via webfetch; LLM summarization of 269 bills is the hermes agent's bounded-execution job.

- [ ] **Step 1: Implement extractCoGaBillSummary to fetch + extract bill PDF text**

Fetch the bill page, find the first `<a class="ext-link-pdf">` in the "All Versions" table (most recent = first row), resolve the relative `/bill_files/{id}/download` URL to `https://leg.colorado.gov/bill_files/{id}/download`, fetch the PDF, and extract text. (PDF text extraction may require `pdf-parse` - add as devDependency if needed, or use a text-extraction fallback.)

- [ ] **Step 2: Add a summarizeBillText LLM-call stub**

Create `generate2ASummaryFromText(billNumber, billText, position)` that produces a <=4-sentence 2A-POV summary. For the opencode proof run, this can use a heuristic (extract key sentences). For the hermes agent run, this is replaced with the LLM call per the prompts.

- [ ] **Step 3: Prove the pipeline on 2026's 16 bills**

Run the assembly script scoped to 2026 only. Verify: titles come from `.full-bill-topic h1`, summaries are generated from bill text, cache `.cache/bill-text/cache.json` is populated, fallback works for any fetch failure.

- [ ] **Step 4: Verify the 16 bills have CO GA titles (not RMGO subjects)**

For each 2026 bill, `title` in the regenerated catalog should match the official CO GA title, not the RMGO subject string. Log any that fell back to RMGO.

- [ ] **Step 5: Document the handoff for the hermes agent**

Note in the assembly script + AGENTS.md that the remaining 253 bills (1998-2025) require the hermes agent's browser tool (for any pages that need JS rendering) + LLM (for genuine 2A summaries), with the same pipeline. Bounded execution: 72h max, 3h per-table timeout, 3 revision cycles max.

---

## Task 7: Re-run assembly to regenerate catalog JSON + populate cache

**Files:** `data/gun-bill-catalog-*.json`, `.cache/bill-text/cache.json`

- [ ] **Step 1: Run the assembly script for 2026**

Run: `npx tsx scripts/assemble-catalog.ts --year 2026` (or equivalent)
Expected: new catalog file with CO GA titles + summaries for 2026; cache populated.

- [ ] **Step 2: Verify catalog integrity**

Run: `jq '[.[] | select(.year==2026)] | .[0].bills | length' data/gun-bill-catalog-*.json`
Expected: 16 (matches input).

- [ ] **Step 3: Verify cache populated**

Run: `jq 'length' .cache/bill-text/cache.json`
Expected: >0 (16 bills cached for 2026).

- [ ] **Step 4: Verify build still produces all rows**

Run: `npm run build`
Expected: `/billwatch` prerendered; 283 `<tr>` in `.next/server/app/billwatch.html`.

---

## Task 8: Portable paths; remove unused API route / getYearData import

**Files:** `src/lib/gun-bill/catalog-client.ts`, `src/app/api/gun-bill-catalog/route.ts`, `src/app/billwatch/page.tsx`

- [ ] **Step 1: Replace hardcoded absolute CATALOG_PATH**

In `catalog-client.ts:5` and `route.ts:5`, replace:
```typescript
const CATALOG_PATH = '/home/noether/renhorne/armed-colorado/data/gun-bill-catalog-20260828_013008.json';
```
with:
```typescript
import path from 'path';
const CATALOG_FILE = 'gun-bill-catalog-20260828_013008.json';
const CATALOG_PATH = path.join(process.cwd(), 'data', CATALOG_FILE);
```

- [ ] **Step 2: Remove unused getYearData import**

In `page.tsx:2`, change `import { loadGunBillCatalog, getYearData } from ...` to `import { loadGunBillCatalog } from ...`.

- [ ] **Step 3: Decide on unused API route**

The `/api/gun-bill-catalog` route is unused (page reads the file directly). Keep it for potential external use but make its path portable too (done in Step 1). Document its existence in AGENTS.md.

- [ ] **Step 4: Verify lint + typecheck + build**

Run: `npx tsc --noEmit && npm run lint && npm run build`
Expected: clean; `/billwatch` prerendered with 283 `<tr>`.

---

## Task 9: Update AGENTS.md

**Files:** `AGENTS.md`

Add two new blocks after the existing `plan-crafting-principles` block.

- [ ] **Step 1: Add verification-and-debugging-protocol block**

```markdown
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
  `npm run preview` (or `next build && next start -H 0.0.0.0`). Compare dev vs prod before concluding.
- This project binds dev to 0.0.0.0:3000 via `package.json` "dev"; LAN IP is 192.168.1.209.

## Verify before claiming done
- Run `npx tsc --noEmit`, `npm run lint`, `npm run build` before declaring success.
- For UI fixes, get explicit confirmation from the user's actual browser (hard-reload),
  not a server-side assumption. State what you verified and how.
<!-- END:verification-and-debugging-protocol -->
```

- [ ] **Step 2: Add billwatch-data-pipeline block**

```markdown
<!-- BEGIN:billwatch-data-pipeline -->
# Billwatch Data Pipeline

## Known project facts
- Catalog: `data/gun-bill-catalog-*.json`, 269 bills across 29 years (2026->1998); ~265 have valid URLs.
- Page `src/app/billwatch/page.tsx` is a SERVER component that reads the file directly via
  `src/lib/gun-bill/catalog-client.ts` (path must be portable via `process.cwd()`).
- `/api/gun-bill-catalog` route exists for external use; the page does NOT use it (direct file read).
- The search/year-filter UI is wired via `src/app/billwatch/BillTableClient.tsx` (client component,
  attaches listeners to `#search-input`/`#year-filter`, filters `tr[data-search]`/`section[data-year]`).
- `scripts/assemble-catalog.ts` regenerates the catalog from RMGO scraped data + CO GA extraction.

## Data sources (do NOT mix up)
- RMGO billwatch: source of position, status, bill number, sponsors, and the bill URL.
  NOT the source of bill titles or summaries.
- CO GA bill page (https://leg.colorado.gov/bills/{billNumber}): ground truth for titles and bill text.
- CO GA bill summary (`.bill-summary-content`): must NOT be copied verbatim into our catalog.

## CO GA DOM selectors (verified 2026-08-28 on https://leg.colorado.gov/bills/HB26-1126)
- Official title: `.full-bill-topic h1`
- Long title: `.bill-long-title`
- Bill number tag: `.bill-detail-bill-number-tag`
- CO GA summary (reference only, do NOT copy): `.bill-summary-content p`
- Prime Sponsors: `.prime-sponsor-block .prime-sponsor-tile` -> `.prime-sponsor-name` + preceding `<p>` (chamber)
- Status badge: `.final-status-badge-* p`
- Most recent bill PDF: first `<a class="ext-link-pdf">` in `#bill-activity-bill-text` "All Versions" table
  -> relative `/bill_files/{id}/download` (resolve to https://leg.colorado.gov/bill_files/{id}/download)

## Cache structure
- Location: `.cache/bill-text/cache.json` (JSON object keyed by full bill URL).
- Each entry: `{ "title": "...", "summary": "..." }`.
- Use `loadBillTextCache()` / `saveBillTextCache()` / `setCachedCoGaData(url, title, summary)`.

## Graceful degradation (plan-crafting-principles #3)
- If CO GA extraction fails (network, parse, missing selector), fall back to RMGO subject for the title
  and the templated `generate2ASummary()` for the summary. Log the failure. Never lose a bill row.

## Bounded execution (from prompts)
- Total time: 72 hours max.
- Per-table timeout: 3 hours max.
- Revision limit: Max 3 cycles per section.
- Escalation: Ask for help after 3 revision cycles.
<!-- END:billwatch-data-pipeline -->
```

- [ ] **Step 3: Verify AGENTS.md is well-formed**

Read back the file; confirm all `<!-- BEGIN -->` / `<!-- END -->` markers are balanced and the existing `nextjs-agent-rules` and `plan-crafting-principles` blocks are intact.

---

## Rollback Procedures (plan-crafting-principles #8)

- **Task 1-2:** `git checkout -- package.json` reverts the preview script. No data changes.
- **Task 3-4:** `git checkout -- src/app/billwatch/page.tsx && rm -f src/app/billwatch/BillTableClient.tsx` reverts page cleanup.
- **Task 5-7:** `git checkout -- src/lib/gun-bill/extract-co-ga-bill-info.ts scripts/assemble-catalog.ts data/gun-bill-catalog-*.json && rm -f .cache/bill-text/cache.json` reverts data pipeline. Original catalog: `git show 22ad83c:data/gun-bill-catalog-20260828_013008.json`.
- **Task 8:** `git checkout -- src/lib/gun-bill/catalog-client.ts src/app/api/gun-bill-catalog/route.ts src/app/billwatch/page.tsx` reverts path portability.
- **Task 9:** `git checkout -- AGENTS.md` reverts the docs additions.

## Testing Strategy (plan-crafting-principles #9)

- **Automated:** `npx tsc --noEmit`, `npm run lint`, `npm run build` after each code task.
- **Manual (rendering):** user hard-reloads `http://192.168.1.209:3000/billwatch` on the remote browser; expect 265 rows across 29 year-sections.
- **Manual (filter):** search "oppose" -> only rows containing "oppose"; pick year 2023 -> only that section; clear -> all rows.
- **Manual (data):** spot-check 2026 bills: titles match CO GA (e.g. HB26-1126 -> "Requirements for Firearms Dealers", NOT "Gun Shop Annihilation Act").
- **Edge cases:** bills with missing/`%20` URLs render with plain text (no broken link); CO GA fetch failure falls back to RMGO subject without dropping the row; mobile view (table-auto wraps without horizontal scroll).
- **Success criteria:** 283 `<tr>` in prerendered HTML; remote browser shows all 265 rows; filter works; 2026 titles are CO GA-derived; `tsc`/`lint`/`build` clean.

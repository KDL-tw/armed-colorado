# Link Pre-2016 Passed Bills to the Colorado Revised Statutes

## Agent System

Your agentic system is a hermes agent running glm 4.7 flash BF16 as an unsloth quant. The unsloth writeup can be found here:
- https://unsloth.ai/docs/models/tutorials/glm-4.7-flash

and the hermes agent writeup can be found here:
- https://hermes-agent.nousresearch.com/docs/assets/files/llms-7240021af84670c2a79f9fdaf65e9e8f.txt

Fully review the hermes agent writeup and the glm 4.7 flash BF16 writeup, understand your capabilities for both the model and hermes, and utilize your capabilities in the execution of this mission. You must do this first before writing any code.

## Mission

Every pre-2016 (1998–2015) bill in the billwatch catalog with status **"Signed into Law"** (28 of 117 pre-2016 bills) must hyperlink to where it was codified in the **Colorado Revised Statutes (CRS)**. Their leg.colorado.gov bill pages are permanently dead (403 — the site only serves 2016+); the statute is where the law lives now. The bill-number link on `/billwatch` (currently a dead 403 link for these bills) must be **replaced** by the CRS section link.

**Out of scope:** the 89 "Dead" pre-2016 bills (no statute exists; leave as plain text — viewing their original bill text is a future task, likely via Colorado Session Laws). All 2016+ bills stay unchanged.

## The CRS resource

- Entry point: `https://advance.lexis.com/container?config=0345494EJAA5ZjE0MDIyYy1kNzZkLTRkNzktYTkxMS04YmJhNjBlNWUwYzYKAFBvZENhdGFsb2e4CaPI4cak6laXLCWyLBO9&crid=5fef9d45-7b10-4cfa-b1ad-0e2e93f1f6ee&prid=34365c9b-cefe-40ce-9841-9801ef48ff3a`
- This is the **official free public access** to the Colorado Statutes Annotated (LexisNexis under contract with the CO Committee on Legal Services — the same container leg.colorado.gov links from its "Colorado Revised Statutes" page). The `config=` token is the stable container ID; `crid`/`prid` are per-visit tokens.
- It is a **JavaScript application**: use the browser tool (`browser_exec`) — plain HTTP fetch returns an empty shell. It has full-text search ("Search All Documents in this source") and a Title/Article/Part table-of-contents browser.

## Browser execution notes

This mission is browser-heavy — 28 bills × multiple searches/navigations each in a JS application. Work accordingly:

- **Terms interstitial**: the first entry into the container shows a Terms & Conditions page with an "I agree" button — accept it (standard free-public-access terms). Expect cookie/notice dialogs along the way; respond to every dialog.
- **Session drops**: the browser session can drop after ~2 minutes of inactivity between commands. Keep browser actions in tight sequences per bill (search → verify → capture → next). If the session drops, simply re-navigate from the entry URL — your progress is safe in the cache as long as you persist after every bill.
- **Incremental persistence**: write each bill's entry to the cache IMMEDIATELY after resolving it. A dropped session, a crash, or an interrupt must never cost more than one bill's work.
- **Pacing / throttling**: pace requests with natural pauses between bills; do not hammer the site. If you hit throttling, a captcha, or a session-expired page: stop, wait a few minutes, re-establish from the entry URL, and resume from the cache.
- **JS rendering**: wait for search results and TOC expansions to fully load before extracting text. Capture document URLs from the address bar only after the page has finished loading.
- **Batching**: work in small batches (~5 bills), then update the progress report before continuing. If the main TUI session must stay responsive during the long grind, run batches as background delegations (`delegate_task` background=true) whose results re-enter the chat.
- **URL durability**: the CRS citation is the canonical datum. Lexis document URLs carry per-visit tokens that can expire — if a captured URL stops resolving later, re-find the section by searching its citation and update the cache.

## Methodology

### 1. Build the worklist
From `data/gun-bill-catalog-20260828.json`, all bills with year < 2016 and `status === "Signed into Law"` (28 bills). Record billNumber, year, subject, and position for each.

### 2. Resolve each bill's codification (in the browser)
Escalate strategies until verified — do NOT give up early; the execution budget exists to be used:

- **S1 — bill-number search**: search the CRS source for the bill number in its citation forms ("HB04-1266", "HB 04-1266"). Statute source notes/credits cite enacting bills.
- **S2 — subject navigation**: navigate the TOC to the likely Title (gun bills → Title 18 Criminal Code, Art. 12; elections → Title 1; local government → Title 29; etc.), then **verify via the section's SOURCE note** that its credit references the bill's session/chapter. Never accept a match on subject resemblance alone.
- **S3 — secondary confirmation**: OLLS publications / Digest of Bills (content.leg.colorado.gov publication-search) and web searches for the bill number + "C.R.S." — official summaries often cite the codification target.

A bill is only **unresolved** after S1–S3 are exhausted within the execution budget (repealed/renumbered bills may legitimately have no live section).

### 3. Primary section only
Link the single most substantive codified section. Store any additional codified sections as `alternates` in the cache for future use.

### 4. Capture per resolved bill
- The CRS citation (e.g., "§ 18-12-204")
- The document URL from the browser address bar
- The matching evidence (source-note text or secondary citation)

### 5. Store durably (incident lessons — see the AGENTS.md WARNING on the shared catalog)
- New cache `.cache/crs-links/cache.json` keyed by bill number:
  `{ "citation": "...", "url": "...", "evidence": "...", "alternates": [...], "status": "resolved|unresolved", "resolvedAt": "..." }`
  — resumable, with corruption-handling read/write helpers (plan-crafting-principles #7).
  **Write each bill's entry immediately after resolving it** (see Browser execution notes — incremental persistence).
- New optional fields on `GunBillCatalogEntry` in `src/lib/gun-bill/types.ts`:
  `crsCitation?: string`, `crsUrl?: string`.
- One-time script (e.g., `scripts/link-pre2016-crs.ts`) populates the committed catalog from the cache.
- **The assemble-catalog pipeline must preserve these fields from cache on regeneration** (exactly like `sponsorLinks` — a regeneration once wiped that feature's data).

### 6. Render (src/app/billwatch/page.tsx)
- Bills with `crsUrl`: the bill-number link points to `crsUrl` (link text unchanged).
- Unresolved pre-2016 bills and "Dead" bills: plain text as now.
- 2016+ bills: unchanged.

### 7. Verify before claiming done (AGENTS.md verification protocol)
- Every `crsUrl` loads in the browser and shows the cited section.
- `npx tsc --noEmit`, `npm run lint`, `npm run build`.
- `npm run preview` (production, NOT dev) + curl `/billwatch` anchor counts on localhost:3000 and 192.168.1.209:3000.
- **Catalog regeneration fields (`sponsorLinks` AND `crs*`) verified intact before committing.**
- Resolution report: N resolved / M unresolved, with the reason and strategy used per unresolved bill.
- Commit with `git show --stat HEAD` confirming the committed files match the message.
- Ask the user to confirm rendering in their browser before declaring done.

### 8. Bounded execution (per AGENTS.md)
72h max, 3h per-table timeout, 3 revision cycles max, escalate to the user after 3 cycles.

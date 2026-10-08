# HANDOFF — billwatch official titles (model switch point)

Date: 2026-10-07 (night)
Plan: `.hermes/plans/2026-10-06_085714-billwatch-official-titles.md` (APPROVED, 8 tasks)
Working dir: `/home/noether/renhorne/armed-colorado` (branch `main`)

This file is a handoff document, not a scratch script. Delete it after the plan
is finished. All scratch artifacts live in `/tmp` (listed below).

---

## 1. Where the plan stands

| Plan task | Status | Evidence |
|---|---|---|
| 1. Baseline audit + backups | DONE | `/tmp/title-audit.py` output matches plan expectations (269 entries, 265 displayed, 151 post-2015 w/ long title, 114 pre-2016, 254 RMGO-subject titles, 157 sponsorLinks, 0 crsUrl). Backups: `/tmp/catalog-backup-20261007-002534.json`, `/tmp/cache-backup-20261007-002534.json` |
| 2. `titleSource` on entry type | DONE | `src/lib/gun-bill/types.ts` (committed in `7eee9cb`) |
| 3. Cached apply (151 post-2015) | DONE — COMMITTED | `7eee9cb feat(billwatch): official CO GA long titles for 150 post-2015 bills (cached)`. Script: `scripts/apply-official-titles.ts` (committed, reusable). Actual applied count = 150 (one post-2015 entry had no valid cached long title — see §6). `python3 /tmp/title-cached-check.py` → green |
| 4. Pre-2016 worklist | DONE | `/tmp/title-worklist.csv` — 114 lines, `billNumber|year|currentTitle|officialUrl|rmgoSubject` |
| 5. Research 114 pre-2016 titles | **IN PROGRESS — 104/114 confirmed** | `/tmp/title-extracted/*.txt` (114 files, one per bill, machine-readable RESULT lines). See §3 for the 10 outstanding |
| 6. Apply research findings | NOT STARTED | Findings JSON `/tmp/title-research-findings.json` exists but is EMPTY (`{}`) — the consolidation gate (`/tmp/title-consolidate.py`) has not yet been run. See §5 step 1 |
| 7. Durable fix (assemble-catalog) | **CODE WRITTEN, UNCOMMITTED, probe PASSED** | `src/lib/gun-bill/extract-co-ga-bill-info.ts` (dirty in git): `getCachedCoGaLongTitle()` added + long-title-wins in both branches of `rmgoToCatalogEntryWithCoGaExtraction`. Task 7 probe already run: `npx tsx scripts/assemble-catalog.ts --year 2026` → sample `data/gun-bill-catalog-2026-sample.json` has 16/16 titles starting "Concerning". See §5 step 2 for the finish |
| 8. Final verification | NOT STARTED | See §5 step 3 |

Git state:
- HEAD `7eee9cb` (commit 1 done)
- Dirty: `M src/lib/gun-bill/extract-co-ga-bill-info.ts` (Task 7 code), `?? data/gun-bill-catalog-2026-sample.json` (Task 7 probe scratch — DELETE before committing Task 7)

---

## 2. Approach that worked (the pipeline)

The plan's original Task 5 method (web_search per bill) was replaced with a
**deterministic extraction pipeline against the Wayback Machine** — every title is
extracted from an archived copy of CO GA's own CLICS bill PDFs / pages, with
hard identity verification. This is more authoritative than CRS-mirror web
search and fully reproducible.

Pipeline files (all in `/tmp`):
- `/tmp/title-extract.py` — the extractor. Per bill: Wayback availability API
  (case-variant: original + lowercase, with/without query) → fetch snapshot →
  direct PDF / HTML container / "frames-only" shell page handling → scans PDF
  hrefs from any container → fetches candidate PDFs (ranked: exact filename
  from URL first, then `$file`, then others) → `pdftotext -layout` → extracts
  the "CONCERNING …" clause → **CONFIRMED only if**: (a) identity match — the
  document header names the SAME bill number AND chamber (regex covers BILL,
  JOINT RESOLUTION, CONCURRENT RESOLUTION; chamber map SB/SC→SENATE,
  HB/HJ/HC→HOUSE), (b) format gate — clause starts "Concerning"/"An Act
  concerning"/"Submitting to the registered electors", 15–800 chars, ends
  ".", contains no "be it enacted". Resumable: skips files already `RESULT:
  CONFIRMED`. Usage: `python3 /tmp/title-extract.py [start] [count]` over
  `/tmp/title-worklist.csv` order.
- `/tmp/title-consolidate.py` — the acceptance gate: reads every
  `/tmp/title-extracted/*.txt`, applies an independent re-validation
  (`validate_fmt`), writes `/tmp/title-research-findings.json` with plan
  schema (`{bn: {status, longTitle, sourceUrl, sourceNote}}`). NOT YET RUN.
  CONFIRMED files whose candidate fails the gate get demoted with a note.
- `/tmp/title-resolve.py` — CDX fallback for the 5 stragglers. **Abandoned**:
  the Wayback CDX API was rate-limited into returning 0 rows for every query
  (see §6). Do not re-run it.
- `/tmp/title-rerun.py` — re-runs only bills listed in
  `/tmp/title-rerun-list.txt` (the 37 first-pass failures). Finished.
- Logs: `/tmp/title-sweep-*.log` (first sweep), `/tmp/title-rerun.log`.

What the extraction handles correctly (all discovered the hard way):
- Domino CLICS layouts: `clicsYYYYa` vs `inetcbill` (pre-2004); `billcontainers`
  vs `fsbillcont2/3` (alias DBs that redirect to billcontainers); `commsumm.nsf`
  (committee summary DB — NOT the bill; identity guard rejects it).
- Container pages: real framesets AND the "This site only supports frames
  compatible browsers!" NOFRAMES shell (PDFs reachable via `<a href>`).
- PDF variant naming: `NNNN_01.pdf` (amended), `BN_00.pdf` (original),
  `BN_C_NNN.pdf` (CRS fiscal note), `NNNN_enr.pdf` (enrolled). Fiscal notes and
  committee summaries are penalized in scoring but can still be accepted when
  they carry identity (see HB13-1169, §3).
- Identity guard: number AND chamber must match. This correctly rejected 5
  bills whose entry URL points at a different bill's container (documented
  RMGO data quirks from the plan's assumptions — never guessed).

---

## 3. The 10 outstanding pre-2016 bills (exact state)

**5 CORRECT SKIPS — do not retry, record as `not_found` with reason in the
findings JSON (or leave to the consolidate gate which reads these files):**

| Bill | Why (identity guard did its job) |
|---|---|
| `HB11-1205` (2011 group) | Entry URL is SB12-025's billcontainer (`.../025_01.pdf`). Document identity = SENATE 12-025. |
| `HB19-1022` (2013 group) | RMGO mis-listing: entry's 2013 URL is bill 13's container (`013_enr.pdf`). Identity = bill 013. |
| `SB13-195` (2013) | Entry URL is bill 197's container (`197_01.pdf`). Identity = SENATE 13-197. |
| `SB14-163` (2014) | Entry URL is bill 135's container (`135_enr.pdf`). Identity = bill 135. |
| `HB07-1264` (2002 group) | Document is HOUSE 02-1264 ("CONCERNING SAFE STORAGE OF FIREARMS TO PREVENT JUVENILE POSSESSION OF FIREARMS.") — a different bill than entry HB07-1264. Plan explicitly named this quirk ("HB07-1264 listed under 2002"). |
| `SCR00-009` (2000) | Senate concurrent resolution; its doc has no "CONCERNING" clause (plan: `not_found` expected and fine). |

That's 6 rows; the other 4 are genuine gaps:

| Bill | State | Next action |
|---|---|---|
| `HB15-1086` (2015) | Container page fetched fine (3 KB NOFRAMES shell, 6 PDFs listed). All 6 PDF availabilities returned None during the sweep — believed rate-limiting, unproven. One interrupted manual fetch of `HB1086_00.pdf` via nearest-snapshot redirect (`http://web.archive.org/web/2024id_/http://www.leg.state.co.us/clics/clics2015a/csl.nsf/8bb6adb029c1979a87256db800058577/61afe625db3b619987257da40002d1d3/$FILE/HB1086_00.pdf`) was cut off by the model switch — **result unknown; re-run and check `/tmp/title-extracted/HB15-1086.txt` first** (it may already say CONFIRMED). | Re-run that single fetch (terminal, 600 s timeout, NOT execute_code — the 300 s kernel cell dies on backoffs). If PDF arrives with HOUSE 15-1086 identity + valid clause → hand-write the CONFIRMED result file in the standard format (see an existing one, e.g. `HB06-1246.txt`). Else → `not_found`. |
| `HB12-1048` (2012) | Entry URL points at `commsumm.nsf` (committee summary DB) — the snapshot is the committee summary itself, no bill PDFs inside. | Find the real billcontainer: query CDX `leg.state.co.us/clics/clics2012a/csl.nsf/billcontainers/*` filtered `.*hb121048_.*\.pdf|.*1048_01\.pdf` **when the API is not rate-limited** (wait several hours; check health with one probe query first). If a PDF is found and passes identity → CONFIRMED. If CDX stays blocked or nothing exists → `not_found` (source note: "entry URL is committee summary; no archived bill PDF found"). |
| `HB12-1064` (2012) | Entry URL is a direct billcontainer `$FILE/HB1064_00.pdf`; availability API returned None on both sweeps. | Same nearest-snapshot trick as HB15-1086: `http://web.archive.org/web/2024id_/` + entry URL. If it 404s, the bill genuinely has no archive → `not_found`. |
| `SB07-069` (2007) | Entry URL `fsbillcont3/...?Open&file=069_01.pdf`; availability None on both sweeps. | Same nearest-snapshot trick: `http://web.archive.org/web/2024id_/` + entry URL. 404 → `not_found`. |

**Do not spend more than one more fetch round per bill.** These 4 are the tail
of a diminishing return; the plan's hard rule stands: `not_found` is always
the safe default, never fabricate. Expected final yield after this round:
104–108 confirmed.

---

## 4. Invariants verified so far (do not regress)

- Cache `.cache/bill-text/cache.json` was NEVER written by any of this task's
  scripts (read-only). Backup exists regardless.
- Commit `7eee9cb` touched ONLY `title` + `titleSource` on the 150 post-2015
  entries; every `summary`, `sponsors`, `sponsorLinks`, `position`, `status`,
  `officialUrl`, `crsUrl` byte-identical (asserted at apply time).
- Baseline for final sweep (plan Task 8): 269 entries / 265 displayed /
  sponsorLinks-nonempty = 157 / crsUrl = 0.
- Every CONFIRMED extracted title passed: identity (number+chamber in the
  document header) + format gate + "be it enacted" bleed check.
- Spot-verified ground truths: `HB99-1316` = "Concerning weapons." (1999,
  genuinely that short), `HB13-1043` clean after the enacting-clause fix,
  `HB13-1169` CRS fiscal note header carries "HB13-1169 … TITLE: CONCERNING
  ALLOWING A VALID COLORADO CONCEALED HANDGUN PERMIT TO SUBSTITUTE…" (CONFIRMED,
  written to its result file with source note).

---

## 5. Exact remaining steps (in order)

### Step 0 — finish the 4 tail bills (§3)
One fetch round each, terminal tool, 600 s timeouts, polite sleeps between
requests. Write CONFIRMED result files in the standard format only on a real
pass; otherwise leave the files as-is (the consolidate gate maps
non-CONFIRMED → not_found/ambiguous with the reason from the file).

### Step 1 — consolidate + apply (plan Tasks 5→6)
```bash
python3 /tmp/title-consolidate.py        # writes /tmp/title-research-findings.json
python3 -c "import json;from collections import Counter;f=json.load(open('/tmp/title-research-findings.json'));print(Counter(v['status'] for v in f.values()));assert len(f)==114"
cd /home/noether/renhorne/armed-colorado
npx tsx scripts/apply-official-titles.ts --findings /tmp/title-research-findings.json --report   # dry run
npx tsx scripts/apply-official-titles.ts --findings /tmp/title-research-findings.json
python3 /tmp/title-cached-check.py       # co-ga-official = 150 + confirmed count
# plan Task 6 invariant heredoc: every co-ga-official pre-2016 title == findings longTitle, summary+sponsors intact
cp /tmp/title-research-findings.json data/pre2016-title-research-findings.json
git add -A && git commit -m "feat(billwatch): researched official long titles for pre-2016 bills (findings file for provenance)"
```
NOTE for the consolidate gate: the 6 correct-skip rows (§3) should be `not_found`
with sourceNote "bill number/URL mismatch — <evidence from result file>" (or
`ambiguous` for the 4 shared-URL cases; the plan's findings schema supports
both — prefer `ambiguous` for HB11-1205 / HB19-1022 / SB13-195 / SB14-163,
`not_found` for HB07-1264 (document is a different bill) and SCR00-009
(concurrent resolution, no concerning clause)). The gate currently derives
status from the RESULT line only — extend it if it doesn't yet carry the
skip reasons into sourceNote.

### Step 2 — commit Task 7 (code already written + probed)
```bash
cd /home/noether/renhorne/armed-colorado
npx tsc --noEmit                 # must be exit 0
rm data/gun-bill-catalog-2026-sample.json   # probe scratch — never commit
npm run lint && npm run build
git add -A && git commit -m "fix(billwatch): catalog assembly prefers cached official long title over h1 topic"
```
(The 2026 sample probe already passed: 16/16 "Concerning". Re-probing is
optional; if done, remember `rm` the sample file again.)

### Step 3 — Task 8 final verification
1. Full invariant sweep (single python heredoc): 269 entries, 265 displayed,
   every entry has exactly one titleSource, co-ga-official count ==
   150 + confirmed, every co-ga-official post-2015 title == cache
   coGaLongTitle (exact), every co-ga-official pre-2016 title == findings
   longTitle, sponsorLinks 157, crsUrl 0, every displayed entry summary +
   sponsors non-empty.
2. Render check (PRODUCTION ONLY per AGENTS.md):
   `npm run preview` → `curl -s http://localhost:3000/billwatch -o /tmp/bw.html`
   → `grep -c "Concerning" /tmp/bw.html` (expect >= 150 + confirmed),
   `grep -o 'data-search=' /tmp/bw.html | wc -l` == 265, and one
   long-title-only search string present. State plainly what was and was not
   confirmed (LAN browser needs the user's machine).
3. Cleanup: `rm /tmp/title-*.py /tmp/title-worklist.csv /tmp/bw.html /tmp/title-rerun-list.txt /tmp/title-sweep-*.log /tmp/title-rerun.log` — KEEP `/tmp/title-research-findings.json` until after the Task 6 commit (it is committed to `data/` there), then it too can go. Delete this handoff file.

---

## 6. What was tried and what failed (so it isn't repeated)

- **Wayback availability API 429s.** Intermittent, not per-URL: the same URL
  succeeds on one sweep and fails the next. Backoff (8–10 s × 4) helps but
  long sessions hit hard limits. Mitigations that worked: resumability (never
  re-fetch confirmed bills), case-variant queries (original/lowercase ×
  with/without query — the API is case-sensitive for some Domino URLs), and
  nearest-snapshot redirects (`/web/2024id_/<original-url>`) which skip the
  API entirely.
- **Wayback CDX API** (`/web.archive.org/cdx/search/cdx`) returned 0 rows for
  every query during the tail phase — rate-limited in a different way than the
  availability API. The `/tmp/title-resolve.py` built around it got nothing.
  If re-attempted: probe with a trivial query first (`url=leg.state.co.us/clics2012a/csl.nsf/billcontainers/*&limit=5`), only proceed when it returns rows. Wait hours, not minutes.
- **`execute_code` 300 s cell budget** is too small for anything with fetch
  backoffs (two kills: one 300 s timeout, one orphan-recovery interruption).
  Use `terminal` with `timeout 600` for any fetch round.
- **Old container HTML (3 KB NOFRAMES shell, no `<frameset>` tag):** the first
  extractor only scanned for framesets → these bills looked like "no PDF
  candidates". Fixed by scanning ALL HTML containers for PDF hrefs.
- **Committee-summary URLs** (commsumm.nsf): 2 entry URLs (HB12-1048, and one
  more) point at the CRS committee summary, not the bill. The committee summary
  is a different document — identity guard rejects it (correct).
- **"Be it enacted" bleed:** an early extractor version let the enacting clause
  into the extracted title (e.g. `HB13-1043` "…THEY OWN. BE IT ENACTED BY THE
  GENERAL ASSEMBLY OF THE"). Fixed: split at "Be it enacted by the General
  Assembly" + format gate rejects any residual occurrence. One stale file was
  deleted and re-extracted cleanly.
- **Identity false-positives avoided:** dropping the chamber check would have
  confirmed 4–6 bills with the WRONG bill's title (the shared-URL quirks).
  Never loosen it.
- **`python3 -c` in terminal** gets smart-approval flagged (harmless noise,
  auto-approved) — prefer heredocs.
- **The interrupted HB15-1086 fetch** (nearest-snapshot of `HB1086_00.pdf`)
  may or may not have written `/tmp/title-extracted/HB15-1086.txt` — check the
  file first; orphan recovery means the effect is unknown.

## 7. Scratch inventory (all in /tmp)

Keep until final cleanup: `title-audit.py`, `title-worklist.py`,
`title-worklist.csv`, `title-cached-check.py`, `title-extract.py`,
`title-consolidate.py`, `title-rerun.py`, `title-rerun-list.txt`,
`title-extracted/` (114 result files), `title-research-findings.json` (empty
until Step 1), `catalog-backup-20261007-002534.json`,
`cache-backup-20261007-002534.json`.
Dead (deletable any time): `title-resolve.py`, `title-sweep-*.log`,
`title-rerun.log`.

Repo files: `scripts/apply-official-titles.ts` (committed, keep),
`src/lib/gun-bill/types.ts` (committed, keep),
`src/lib/gun-bill/extract-co-ga-bill-info.ts` (UNCOMMITTED Task 7 change),
`data/gun-bill-catalog-2026-sample.json` (UNTRACKED probe scratch — DELETE
before Task 7 commit).

## 8. Ground rules (carried over — do not waive)

- Never write a `confirmed` title that was not seen in an archived CO GA
  document with matching identity. `not_found` is always the safe default.
- Cache entries are never rewritten by the apply script; catalog writes only
  via `scripts/apply-official-titles.ts` (2-space JSON, matches existing
  format).
- `npx tsc --noEmit`, `npm run lint`, `npm run build` must all pass before any
  commit. Render claims require production `npm run preview` + curl, never
  dev mode (AGENTS.md).
- Rollback: `git revert <sha>` per commit; pre-task catalog snapshot also in
  repo at `data/gun-bill-catalog-20260828_013008.json` (older state, reference
  only).

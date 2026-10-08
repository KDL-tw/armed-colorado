# Armed Colorado

Reference site for Colorado firearms law: Billwatch (268 gun bills across 29 years, 1998–2026), 2A litigation tracker, SB25-003 FAQs, civic guides, and an unauthenticated admin CMS.

**Stack:** Next.js 16 App Router · React 19 · Tailwind v4 · Vercel · Supabase Free (Special projects TSOR) · optional Resend

## Local development

```bash
cp .env.example .env.local
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Preview on another device (LAN)

`npm run dev` binds to `0.0.0.0` and is reachable at the `Network:` URL (e.g. `http://192.168.1.209:3000`). For confirming rendering on a remote/LAN browser, prefer **production** instead of dev:

```bash
npm run preview   # builds + serves on 0.0.0.0:3000
```

Dev mode (Turbopack) streams RSC and loads hundreds of async chunks + HMR, which is not representative of what a remote browser ultimately renders — especially for large pages like Billwatch. Add your host machine's LAN IP to `allowedDevOrigins` in `next.config.ts` if you do use dev remotely.

## Environment

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | TSOR free project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key (public read + alert/pageview inserts) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only admin writes — never expose to the client |
| `RESEND_API_KEY` / `RESEND_FROM_EMAIL` | Optional alert confirmation emails |

## Supabase (Special projects TSOR — Free)

1. In the **Special projects TSOR** free org, create a project (e.g. `armed-colorado`).
2. SQL Editor → run [`supabase/migrations/20260730140000_init.sql`](supabase/migrations/20260730140000_init.sql).
3. Copy URL, anon key, and service role key into `.env.local` and Vercel env.

Do **not** enable Supabase Auth for v1. RLS allows public `SELECT` on published content; CMS mutations go through Next.js server actions with the service role.

Without Supabase configured, the site still runs using in-repo fallbacks for litigation + resources; admin writes will fail until env is set.

## Billwatch

Billwatch displays 268 Colorado gun bills (1998–2026) in reverse-chronological tables with status, **Enacted** (governor signing date), bill number, title, 2A-POV summary, and prime sponsors. Data is read from a local JSON catalog (`data/gun-bill-catalog-*.json`) — no external API required. (The original RMGO "position" column was removed; status + Enacted now lead the table.)

**Enacted column:** Populated only for bills with status "Signed into Law". Post-2016 dates come from the "Signed Act" row of the Bill Text "All Versions" table on each CO GA bill page; pre-2016 dates come from the "NOTE: The governor signed this measure on <date>" line in the archived bill-text PDFs, or (where that version was pre-signature) the CO GA *Digest of Bills* (`content.leg.colorado.gov/sites/default/files/digest{year}.pdf`). Bills with no recoverable signing date render an em-dash. Applied by `scripts/apply-enacted-dates.ts` from the staged `data/enacted-dates-*.json` files; each date is also cached per URL as `enactedDate` so catalog regeneration preserves it.

**Table layout:** `table-auto` with `max-w-screen-2xl` container, light width hints for short columns (`w-32`, `w-28`) plus horizontal cell padding (`px-3`) on the Status/Enacted/Bill Number columns so entries have obvious separation, and auto-width for Title/Summary with `min-w` and inter-column padding (`pr-6`/`pl-2`) so text doesn't bleed into adjacent columns. See `AGENTS.md` → "Table layout rules" before changing table markup.

**Data pipeline:**
- **RMGO billwatch** provides status, bill number, sponsors, and the bill URL. (RMGO's position field is no longer shown; two RMGO "Signed into Law" entries — SB22-031 2022, HB16-1204 2016 — were corrected to "Dead" after the CO GA pages showed both were postponed indefinitely.)
- **Colorado General Assembly** (`leg.colorado.gov/bills/{billNumber}`) is the ground truth for bill titles, bill text, and the Enacted date. Titles are extracted via `.full-bill-topic h1`; summaries are generated from bill text (not copied from the CO GA website summary). Note: `leg.colorado.gov` returns HTTP 406 to plain HTTP clients (curl/node fetch) — fetch these pages with a real browser.
- Extraction results are cached in `.cache/bill-text/cache.json` (keyed by full bill URL).
- If CO GA extraction fails, the pipeline falls back to RMGO data gracefully — no bill row is ever lost.

**Regenerating the catalog:**

```bash
npx tsx scripts/assemble-catalog.ts --year 2026   # single-year sample
npx tsx scripts/assemble-catalog.ts               # full catalog (all 268 bills)
```

> **Warning:** The catalog file is shared by multiple features. Regeneration rewrites every entry — verify `sponsorLinks` and `enactmentDate` survived before committing. The regression baseline lives in `.cache/regression-baselines.json`.

The search and year-filter controls on the page are wired via a client component (`BillTableClient.tsx`) that filters rows in-place — no re-fetch needed.

> **Status:** CO GA title + summary extraction is complete for the recoverable 2016–2026 bills and for pre-2016 bills via archived bill text (116/117; HB98-1260 has no bill text and keeps a 1-sentence stub). Enacted dates are populated for 80 of 84 signed bills; the remaining 4 (SB99-053, SB01-032, SB14-038, SB15-175) have no recoverable signing date in any source. See `AGENTS.md` → "billwatch-data-pipeline" for details.

## Admin

`/admin` has **no login**. Keep the URL private. Sections: Content, Litigation, Events, Analytics, API health.

## Design conventions

- **Header:** All pages use the same solid `bg-navy` sticky header (`SiteHeader.tsx`) with white logo, cream nav links, and amber active state. The home page is NOT an overlay — it uses the same bar so text is always readable.
- **Colors:** `--oxblood` (`#6b1520`) is for accents (CTA buttons, status badges) — never for nav text against navy, where it's unreadable. Use `text-cream`/`text-white` on navy backgrounds.
- **Tables:** `table-auto`, not `table-fixed`. Never use `min-width` on columns inside `overflow-x-auto` (causes layout-engine failures in remote browsers). See `AGENTS.md` → "verification-and-debugging-protocol".

## Deploy

1. Push to GitHub (`armed-colorado`).
2. Import the repo on Vercel.
3. Set env vars (including Supabase from TSOR).
4. Deploy.

## Scripts

- `npm run dev` — development (binds `0.0.0.0`; also reachable at the `Network:` URL)
- `npm run build` — production build
- `npm run start` — serve build (localhost by default; use `npm run start -- -H 0.0.0.0` for LAN)
- `npm run preview` — build + serve on `0.0.0.0:3000` (use this for LAN/remote viewing, not dev)
- `npm run lint` — ESLint
- `npx tsx scripts/assemble-catalog.ts` — regenerate the gun bill catalog from RMGO + CO GA data

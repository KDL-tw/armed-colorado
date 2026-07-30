# Armed Colorado

Reference site for Colorado firearms law: Billwatch (Umbrella Civic stub), 2A litigation tracker, SB25-003 FAQs, civic guides, and an unauthenticated admin CMS.

**Stack:** Next.js App Router · Vercel · Supabase Free (Special projects TSOR) · optional Resend

## Local development

```bash
cp .env.example .env.local
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | TSOR free project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key (public read + alert/pageview inserts) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only admin writes — never expose to the client |
| `UMBRELLA_API_URL` / `UMBRELLA_API_KEY` | Optional; leave empty for Billwatch stub (no fake bills) |
| `RESEND_API_KEY` / `RESEND_FROM_EMAIL` | Optional alert confirmation emails |

## Supabase (Special projects TSOR — Free)

1. In the **Special projects TSOR** free org, create a project (e.g. `armed-colorado`).
2. SQL Editor → run [`supabase/migrations/20260730140000_init.sql`](supabase/migrations/20260730140000_init.sql).
3. Copy URL, anon key, and service role key into `.env.local` and Vercel env.

Do **not** enable Supabase Auth for v1. RLS allows public `SELECT` on published content; CMS mutations go through Next.js server actions with the service role.

Without Supabase configured, the site still runs using in-repo fallbacks for litigation + resources; admin writes will fail until env is set.

## Billwatch / Umbrella Civic

Billwatch is stubbed until Umbrella credentials exist. Request API access: [umbrellacivic@gmail.com](mailto:umbrellacivic@gmail.com). SMART Act fiscal scraping is deferred.

## Admin

`/admin` has **no login**. Keep the URL private. Sections: Content, Litigation, Events, Analytics, API health.

## Deploy

1. Push to GitHub (`armed-colorado`).
2. Import the repo on Vercel.
3. Set env vars (including Supabase from TSOR).
4. Deploy.

## Scripts

- `npm run dev` — development
- `npm run build` — production build
- `npm run start` — serve build
- `npm run lint` — ESLint

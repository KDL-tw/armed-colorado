-- Armed Colorado CMS schema (Free tier, no Auth)
-- Apply on Special projects TSOR free workspace.

-- Litigation tracker
create table if not exists public.litigation_cases (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  court text,
  docket text,
  parties text,
  status text not null default 'active',
  summary text not null default '',
  timeline jsonb not null default '[]'::jsonb,
  sources jsonb not null default '[]'::jsonb,
  published boolean not null default true,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- FAQ / page copy
create table if not exists public.faq_entries (
  id uuid primary key default gen_random_uuid(),
  page_key text not null,
  question text not null,
  answer text not null,
  sort_order int not null default 0,
  published boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.site_pages (
  id uuid primary key default gen_random_uuid(),
  page_key text unique not null,
  title text not null,
  body_md text not null default '',
  updated_at timestamptz not null default now()
);

create table if not exists public.resource_links (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  category text not null default 'advocacy',
  url text,
  description text not null default '',
  note text,
  colorado_contact boolean,
  sort_order int not null default 0,
  published boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.ccw_orgs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  url text,
  region text,
  phone text,
  notes text,
  sort_order int not null default 0,
  published boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.sb25_county_availability (
  id uuid primary key default gen_random_uuid(),
  county text not null,
  status text not null default 'unknown',
  provider_notes text,
  class_url text,
  updated_at timestamptz not null default now(),
  unique (county)
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  starts_at timestamptz,
  location text,
  url text,
  description text not null default '',
  published boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.alert_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  topics text[] not null default '{}',
  created_at timestamptz not null default now(),
  unique (email)
);

create table if not exists public.api_health_checks (
  id uuid primary key default gen_random_uuid(),
  service text unique not null,
  status text not null,
  detail text,
  checked_at timestamptz not null default now()
);

create table if not exists public.page_views (
  id bigserial primary key,
  path text not null,
  referrer text,
  created_at timestamptz not null default now()
);

create index if not exists page_views_path_idx on public.page_views (path);
create index if not exists page_views_created_at_idx on public.page_views (created_at desc);
create index if not exists faq_entries_page_key_idx on public.faq_entries (page_key);

-- RLS: public read for published content; no anon writes
alter table public.litigation_cases enable row level security;
alter table public.faq_entries enable row level security;
alter table public.site_pages enable row level security;
alter table public.resource_links enable row level security;
alter table public.ccw_orgs enable row level security;
alter table public.sb25_county_availability enable row level security;
alter table public.events enable row level security;
alter table public.alert_subscribers enable row level security;
alter table public.api_health_checks enable row level security;
alter table public.page_views enable row level security;

-- Drop policies if re-running
do $$ begin
  -- litigation
  drop policy if exists litigation_public_read on public.litigation_cases;
  create policy litigation_public_read on public.litigation_cases
    for select to anon, authenticated using (published = true);

  drop policy if exists faq_public_read on public.faq_entries;
  create policy faq_public_read on public.faq_entries
    for select to anon, authenticated using (published = true);

  drop policy if exists site_pages_public_read on public.site_pages;
  create policy site_pages_public_read on public.site_pages
    for select to anon, authenticated using (true);

  drop policy if exists resources_public_read on public.resource_links;
  create policy resources_public_read on public.resource_links
    for select to anon, authenticated using (published = true);

  drop policy if exists ccw_orgs_public_read on public.ccw_orgs;
  create policy ccw_orgs_public_read on public.ccw_orgs
    for select to anon, authenticated using (published = true);

  drop policy if exists sb25_public_read on public.sb25_county_availability;
  create policy sb25_public_read on public.sb25_county_availability
    for select to anon, authenticated using (true);

  drop policy if exists events_public_read on public.events;
  create policy events_public_read on public.events
    for select to anon, authenticated using (published = true);

  -- alert signup: allow anon insert only (email capture)
  drop policy if exists alerts_anon_insert on public.alert_subscribers;
  create policy alerts_anon_insert on public.alert_subscribers
    for insert to anon, authenticated with check (true);

  drop policy if exists alerts_no_select on public.alert_subscribers;
  -- no select for anon (privacy)

  drop policy if exists health_public_read on public.api_health_checks;
  create policy health_public_read on public.api_health_checks
    for select to anon, authenticated using (true);

  -- page views: anon insert for analytics beacon
  drop policy if exists page_views_anon_insert on public.page_views;
  create policy page_views_anon_insert on public.page_views
    for insert to anon, authenticated with check (true);
end $$;

-- Seed litigation (real known cases — editable in admin)
insert into public.litigation_cases (slug, title, court, docket, parties, status, summary, timeline, sources)
values
  (
    'garcia-v-polis',
    'Garcia v. Polis',
    'U.S. District Court for the District of Colorado',
    null,
    'Plaintiffs challenging Colorado firearm waiting-period / related restrictions; Jared Polis et al. as defendants',
    'active',
    'Federal challenge related to Colorado firearm waiting-period rules. Track docket updates and court orders for current status.',
    '[{"date":"2024","label":"Case active — verify latest docket entries"}]'::jsonb,
    '[{"label":"CourtListener / PACER search","url":"https://www.courtlistener.com/"}]'::jsonb
  ),
  (
    'del-toro-v-polis',
    'Del Toro v. Polis',
    'U.S. District Court for the District of Colorado',
    '1:25-cv-02725',
    'Israel Del Toro, Kathleen Clayton, Luke Sorensen, Nathanael Skiver, Garrett Flicker, Colorado State Shooting Association, Jason Reeves v. Jared Schutz Polis, Philip Jacob Weiser, Michael J. Allen, Laura Clellan',
    'active',
    'Federal lawsuit challenging SB25-003 (semiautomatic firearms & rapid-fire devices / permit-to-purchase scheme) on Second Amendment grounds. Plaintiffs include CSSA; counsel includes Mountain States Legal Foundation.',
    '[
      {"date":"2025-09-02","label":"Complaint filed"},
      {"date":"2026-01","label":"Motion practice ongoing — check docket for current posture"}
    ]'::jsonb,
    '[
      {"label":"Justia docket","url":"https://dockets.justia.com/docket/colorado/codce/1:2025cv02725/246985"},
      {"label":"SB25-003 bill page","url":"https://leg.colorado.gov/bills/sb25-003"}
    ]'::jsonb
  ),
  (
    'doj-v-denver',
    'DOJ v. Denver',
    'Federal court (Colorado)',
    null,
    'United States Department of Justice matters involving the City and County of Denver — verify caption and status on official dockets',
    'monitoring',
    'Placeholder tracker entry for Department of Justice litigation involving Denver related to firearms policy. Confirm active caption, case number, and posture before citing.',
    '[{"date":"n/a","label":"Awaiting confirmed docket details — edit in admin"}]'::jsonb,
    '[{"label":"DOJ press / cases","url":"https://www.justice.gov/"}]'::jsonb
  ),
  (
    'doj-v-colorado',
    'DOJ v. Colorado',
    'Federal court (Colorado)',
    null,
    'United States Department of Justice matters involving the State of Colorado — verify caption and status on official dockets',
    'monitoring',
    'Placeholder tracker entry for DOJ litigation involving Colorado related to firearms policy. Confirm active caption, case number, and posture before citing.',
    '[{"date":"n/a","label":"Awaiting confirmed docket details — edit in admin"}]'::jsonb,
    '[{"label":"DOJ press / cases","url":"https://www.justice.gov/"}]'::jsonb
  )
on conflict (slug) do nothing;

-- Resource directory seed
insert into public.resource_links (slug, name, category, url, description, note, colorado_contact, sort_order) values
  ('cffla', 'Colorado Firearms Freedom / CFFLA', 'advocacy', 'https://www.cffla.org/', 'Colorado firearms legislation and advocacy.', null, true, 10),
  ('rmgo', 'Rocky Mountain Gun Owners', 'advocacy', 'https://rmgo.org/', 'Colorado gun-rights advocacy organization.', null, true, 20),
  ('cssa', 'Colorado State Shooting Association', 'advocacy', 'https://cssa.org/', 'State shooting association; plaintiff in Del Toro v. Polis.', null, true, 30),
  ('nra', 'National Rifle Association', 'advocacy', 'https://home.nra.org/', 'National firearms advocacy and training resources.', null, true, 40),
  ('wfgr', 'Women for Gun Rights', 'advocacy', 'https://womenforgunrights.com/', 'National organization focused on women and firearms rights.', null, false, 50),
  ('goa', 'Gun Owners of America', 'advocacy', 'https://www.gunowners.org/', 'National gun-rights organization.', 'No dedicated Colorado state contact listed at time of publishing — verify on GOA site.', false, 60),
  ('fpc', 'Firearms Policy Coalition', 'legal', 'https://www.firearmspolicy.org/', 'Litigation and policy advocacy for Second Amendment rights.', null, false, 70),
  ('saf', 'Second Amendment Foundation', 'legal', 'https://www.saf.org/', 'Litigation and education advancing Second Amendment rights.', null, false, 80),
  ('mslf', 'Mountain States Legal Foundation', 'legal', 'https://mslegal.org/', 'Public-interest law firm; counsel in Del Toro v. Polis.', null, true, 90),
  ('ogvp', 'Colorado Office of Gun Violence Prevention', 'government', 'https://cdphe.colorado.gov/ogvp', 'State office funding prevention programs and publishing studies. Review annual state appropriations and OGVP reports for budget and study figures — cite official sources; do not invent totals.', 'Track annual CDPHE / state budget line items for cost context.', true, 100),
  ('coviolence', 'COViolence.org', 'research', 'https://coviolence.org/', 'Colorado violence data and related resources.', null, true, 110),
  ('mental-health', 'Colorado mental health resources', 'health', 'https://cdhs.colorado.gov/behavioral-health', 'Statewide behavioral health entry points and crisis resources.', 'If you or someone else is in crisis, call or text 988.', true, 120),
  ('hold-my-guns', 'Hold My Guns', 'safety', 'https://holdmyguns.org/', 'Temporary out-of-home firearm storage options.', null, false, 130),
  ('pink-pistols', 'Pink Pistols', 'community', 'https://www.pinkpistols.org/', 'LGBTQ firearm rights and self-defense community.', null, false, 140),
  ('liberal-gun-club', 'Liberal Gun Club', 'community', 'https://theliberalgunclub.com/', 'Left-of-center firearm owners community and education.', null, false, 150),
  ('democrat-gun-club', 'Democrat Gun Club', 'community', null, 'No established statewide Colorado “Democrat Gun Club” chapter identified at publish time.', 'To start a chapter: define bylaws, affiliate with an existing club (e.g. Liberal Gun Club), secure range/insurance, and list events on Armed Colorado Events.', false, 160)
on conflict (slug) do nothing;

insert into public.faq_entries (page_key, question, answer, sort_order) values
  ('sb25-003', 'What does SB25-003 generally require?', 'SB25-003 restricts manufacture, sale, and purchase of specified semiautomatic firearms and rapid-fire devices beginning August 1, 2026, with a permit-to-purchase / training pathway and listed exemptions. Always read the enrolled act and CPW / sheriff guidance for current rules.', 10),
  ('sb25-003', 'Where do I find official class / permit information?', 'Colorado Parks and Wildlife and county sheriffs publish implementing guidance as rules finalize. Check CPW and your county sheriff for class availability by county — this site’s county table is editable in admin and may lag official sources.', 20),
  ('sb25-003', 'Is availability the same in every county?', 'No. Training and permit logistics can vary by county. Use the county availability table on this page and confirm directly with local providers and the sheriff’s office.', 30);

insert into public.api_health_checks (service, status, detail) values
  ('umbrella', 'unconfigured', 'UMBRELLA_API_KEY not set — Billwatch stub only'),
  ('supabase', 'ok', 'Database schema applied'),
  ('resend', 'unconfigured', 'RESEND_API_KEY not set — alerts store-only')
on conflict (service) do update set status = excluded.status, detail = excluded.detail, checked_at = now();

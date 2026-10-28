/**
 * Build the committee catalog + regenerate the reference files for /legislators.
 *
 * SOURCE OF TRUTH (user decision 2026-10-28): the reference markdown files in
 * data/committee-data/ are authoritative for 2026 roster content. This script
 * brings them CURRENT by regenerating them from the live site, then writes the
 * catalog from that same in-memory data (so catalog and reference agree by
 * construction). The live site also supplies descriptions, committee-page
 * URLs, photos, and district numbers (not in the reference).
 *
 * Usage: npx tsx scripts/fetch-committees.ts
 *
 * Writes:
 *   data/committee-data/colorado_house_committees_contact.md  (regenerated)
 *   data/committee-data/colorado_senate_committees.md         (regenerated)
 *   data/committee-catalog.json                               (site data)
 *   data/committee-photos/<slug>.jpg                          (width 400px)
 *
 * Idempotent: photos are skipped if already on disk. The reference files and
 * catalog are fully rewritten each run from the current live data. Fails
 * loudly (non-zero exit) if any committee/member field is missing — the
 * reference is a ground-truth artifact and must be complete.
 */

import * as fs from "fs";
import * as path from "path";
import sharp from "sharp";
import type { CommitteeCatalog, CommitteeMember } from "../src/lib/committee/types";

const BASE = "https://leg.colorado.gov";
const UA = { "User-Agent": "ArmedColorado-CommitteeRoster/1.0" };
const DATA = path.join(process.cwd(), "data");
const CATALOG_PATH = path.join(DATA, "committee-catalog.json");
const PHOTOS_DIR = path.join(DATA, "committee-photos");
const HOUSE_REF = path.join(DATA, "committee-data/colorado_house_committees_contact.md");
const SENATE_REF = path.join(DATA, "committee-data/colorado_senate_committees.md");

interface LiveMember {
  slug: string;
  role: string | null;
  picture: string | null;
}
interface LiveCommittee {
  chamber: "house" | "senate";
  slug: string;
  name: string;
  url: string;
  description: string;
  members: LiveMember[];
}
interface Contact {
  name: string;
  title: string;
  district: string;
  email: string;
  phone: string;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}
function clean(s: string | undefined | null): string {
  if (!s) return "";
  return decodeEntities(s).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function getHtml(url: string): Promise<string> {
  const res = await fetch(url, { redirect: "follow", headers: UA });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

/** 1. Committee index → session + regular house/senate committees. */
async function fetchCommitteeList(): Promise<{
  session: string;
  links: { chamber: "house" | "senate"; slug: string; url: string }[];
}> {
  const idx = await getHtml(`${BASE}/committees`);
  const session = idx.match(/\/committees\/(\d{4}[AB]?)\//)?.[1];
  if (!session) throw new Error("Could not determine session code from /committees");
  const seen = new Set<string>();
  const links: { chamber: "house" | "senate"; slug: string; url: string }[] = [];
  for (const m of idx.matchAll(/href="\/committees\/\d{4}[AB]?\/(house|senate)\/([^"]+)"/g)) {
    const key = `${m[1]}/${m[2]}`;
    if (seen.has(key)) continue;
    seen.add(key);
    links.push({ chamber: m[1] as "house" | "senate", slug: m[2], url: `${BASE}/committees/${session}/${m[1]}/${m[2]}` });
  }
  if (links.length === 0) throw new Error("No regular committee links found on /committees");
  return { session, links };
}

/** 2. Committee page → name (H1), description, member tiles (slug/role/picture). */
async function fetchCommittee(l: { chamber: "house" | "senate"; slug: string; url: string }): Promise<LiveCommittee> {
  const html = await getHtml(l.url);
  const name = clean(html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)?.[1]);
  const description = clean(
    html.match(/<div class='committee-detail-committee-description'>([\s\S]*?)<\/div>/)?.[1]
  );
  if (!name) throw new Error(`Empty committee name for ${l.url}`);
  if (!description) throw new Error(`Empty description for ${l.url}`);
  const members: LiveMember[] = [];
  const seen = new Set<string>();
  for (const t of html.matchAll(/<a class="cm-link"[^>]*>[\s\S]*?<\/a>/g)) {
    const block = t[0];
    const slug = block.match(/href="\/legislators\/([^"]+)"/)?.[1];
    if (!slug || seen.has(slug)) continue;
    seen.add(slug);
    const aria = block.match(/aria-label="([^"]*)"/)?.[1] ?? "";
    const role = aria.match(/,\s*(Chair|Vice Chair)$/)?.[1] ?? null;
    const picture = block.match(/<img class="comm-mem-picture"[^>]*src="([^"]*)"/)?.[1] ?? null;
    members.push({ slug, role, picture });
  }
  if (members.length === 0) throw new Error(`No members found on ${l.url}`);
  return { chamber: l.chamber, slug: l.slug, name, url: l.url, description, members };
}

/** 3. Legislator page → name, title, district, email, phone. */
async function fetchContact(slug: string, chamber: "house" | "senate"): Promise<Contact> {
  const html = await getHtml(`${BASE}/legislators/${slug}`);
  const name = clean(html.match(/<h1 class='mb-0'>([\s\S]*?)<\/h1>/)?.[1]);
  const title =
    clean(html.match(/legislator-title[^>]*>\s*([^<]+?)\s*</)?.[1]) ||
    (chamber === "house" ? "Representative" : "Senator");
  const districtNum = html.match(/district-number[^>]*>(\d+)/)?.[1];
  const email = html.match(/mailto:([^"]+@[^"]+)"/)?.[1];
  const phone = html.match(/tel:([0-9][0-9-]{6,})"/)?.[1];
  if (!name || !districtNum || !email || !phone) {
    throw new Error(
      `Missing name/district/email/phone for ${slug} (got name=${!!name} dist=${!!districtNum} email=${!!email} phone=${!!phone})`
    );
  }
  const district = `${chamber === "house" ? "HD" : "SD"}-${districtNum}`;
  return { name, title, district, email, phone };
}

/** 4. Photo download + resize. Skips if already on disk. Returns true on
 * success (or already-present), false on failure — the caller degrades
 * gracefully (placeholder) instead of aborting the run, so a 429 on one photo
 * never blocks the ground-truth artifacts (reference files + catalog). */
async function fetchPhoto(slug: string, url: string | null): Promise<boolean> {
  const out = path.join(PHOTOS_DIR, `${slug}.jpg`);
  if (fs.existsSync(out)) return true;
  if (!url) {
    console.warn(`  no picture URL for ${slug}`);
    return false;
  }
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const res = await fetch(url, { redirect: "follow", headers: UA });
      if (res.status === 429 || res.status === 503) {
        const backoff = 3000 * attempt;
        console.warn(`  photo ${res.status} for ${slug}, retrying in ${backoff}ms (attempt ${attempt}/4)`);
        await sleep(backoff);
        continue;
      }
      if (!res.ok) throw new Error(`Photo HTTP ${res.status} for ${slug}`);
      const buf = Buffer.from(await res.arrayBuffer());
      await sharp(buf, { failOn: "warning" }).resize({ width: 400, fit: "inside" }).jpeg({ quality: 80 }).toFile(out);
      return true;
    } catch (e) {
      if (attempt < 4) {
        console.warn(`  photo error for ${slug} (${(e as Error).message}), retrying in ${3000 * attempt}ms`);
        await sleep(3000 * attempt);
        continue;
      }
      console.warn(`  photo FAILED for ${slug}: ${(e as Error).message}`);
      return false;
    }
  }
  return false;
}

/** 5. Reference serializers (format verified lossless by round-trip test). */
function serializeHouse(cs: LiveCommittee[], contacts: Record<string, Contact>): string {
  let out = "# Colorado General Assembly Committee Members Contact Information\n\n## House Committees of Reference\n";
  for (const c of cs) {
    out += `\n### ${c.name}\n\n`;
    out += `**Email List:** ${c.members.map((m) => contacts[m.slug].email).join(", ")}\n\n`;
    out += `**Committee Members:**\n\n`;
    for (const m of c.members) {
      const ct = contacts[m.slug];
      out += `${ct.name}${m.role ? ` - ${m.role}` : ""}\n`;
      out += `Email: ${ct.email}\n`;
      out += `Phone: ${ct.phone}\n\n\n`;
    }
  }
  out += `\n## Data Collection Notes\n\n**Methodology:**\n- Regenerated from leg.colorado.gov by scripts/fetch-committees.ts\n\n---\n\n*Regenerated from https://leg.colorado.gov/committees on ${new Date().toISOString().slice(0, 10)}*\n`;
  return out;
}
function serializeSenate(cs: LiveCommittee[], contacts: Record<string, Contact>): string {
  let out = "# Colorado Senate Committees Contact Information\n";
  for (const c of cs) {
    out += `\n## ${c.name.toUpperCase()} COMMITTEE\n\n`;
    out += `**Email List:** ${c.members.map((m) => contacts[m.slug].email).join(", ")}\n\n`;
    out += `**Committee Members:**\n\n`;
    for (const m of c.members) {
      const ct = contacts[m.slug];
      out += `Name: ${ct.name}${m.role ? ` - ${m.role}` : ""}\n`;
      out += `Email: ${ct.email}\n`;
      out += `Phone: ${ct.phone}\n\n\n`;
    }
    out += `---\n`;
  }
  out += `\n*Data extracted from https://leg.colorado.gov/committees on ${new Date().toISOString().slice(0, 10)}*\n*All information is current and from official state legislature website*\n`;
  return out;
}

async function main() {
  fs.mkdirSync(PHOTOS_DIR, { recursive: true });

  const { session, links } = await fetchCommitteeList();
  console.log(`Session ${session}: ${links.length} regular committees`);

  const live: LiveCommittee[] = [];
  for (const l of links) {
    live.push(await fetchCommittee(l));
    console.log(`  committee: ${l.url}`);
    await sleep(300);
  }

  // Unique legislators (a legislator sits in exactly one chamber).
  const chamberOf = new Map<string, "house" | "senate">();
  for (const c of live) for (const m of c.members) chamberOf.set(m.slug, c.chamber);
  const slugs = [...new Set(live.flatMap((c) => c.members.map((m) => m.slug)))];
  console.log(`Legislators: ${slugs.length} unique`);

  const contacts: Record<string, Contact> = {};
  for (const slug of slugs) {
    contacts[slug] = await fetchContact(slug, chamberOf.get(slug)!);
    console.log(`  contact: ${slug}`);
    await sleep(250);
  }

  // Photos.
  for (const c of live) {
    for (const m of c.members) {
      await fetchPhoto(m.slug, m.picture);
      await sleep(400);
    }
  }

  // Regenerate the reference files (ground truth, brought current).
  const house = live.filter((c) => c.chamber === "house");
  const senate = live.filter((c) => c.chamber === "senate");
  fs.writeFileSync(HOUSE_REF, serializeHouse(house, contacts), "utf8");
  fs.writeFileSync(SENATE_REF, serializeSenate(senate, contacts), "utf8");
  console.log(`Wrote ${HOUSE_REF} and ${SENATE_REF}`);

  // Build the catalog from the same in-memory data (source of truth).
  const catalog: CommitteeCatalog = {
    session,
    fetchedAt: new Date().toISOString(),
    committees: live.map((c) => {
      const members: CommitteeMember[] = c.members.map((m) => {
        const ct = contacts[m.slug];
        return {
          slug: m.slug,
          name: ct.name,
          title: ct.title,
          role: m.role,
          district: ct.district,
          email: ct.email,
          phone: ct.phone,
          photo: fs.existsSync(path.join(PHOTOS_DIR, `${m.slug}.jpg`)),
        };
      });
      return { chamber: c.chamber, slug: c.slug, name: c.name, url: c.url, description: c.description, members };
    }),
  };
  fs.writeFileSync(CATALOG_PATH, JSON.stringify(catalog, null, 2), "utf8");

  const totalSeats = catalog.committees.reduce((n, c) => n + c.members.length, 0);
  const photos = fs.readdirSync(PHOTOS_DIR).filter((f) => f.endsWith(".jpg")).length;
  const noPhoto = catalog.committees.flatMap((c) => c.members.filter((m) => !m.photo).map((m) => m.slug));
  console.log(
    `\nDone. ${catalog.committees.length} committees, ${totalSeats} member seats, ${slugs.length} unique legislators, ${photos} photos on disk.` +
      (noPhoto.length ? ` MISSING PHOTOS: ${noPhoto.join(", ")}` : " all members have photos.")
  );
  if (noPhoto.length > 0) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

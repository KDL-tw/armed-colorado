import Link from "next/link";
import {
  upsertCcwOrg,
  upsertCounty,
  upsertFaq,
  upsertResource,
  deleteFaq,
} from "@/lib/actions/admin";
import { createServiceClient } from "@/lib/supabase/clients";
import { FALLBACK_RESOURCES, FALLBACK_SB25_FAQS } from "@/lib/data/fallback";

export default async function AdminContentPage() {
  const client = createServiceClient();
  let faqs = FALLBACK_SB25_FAQS;
  let resources = FALLBACK_RESOURCES;
  let counties: {
    id?: string;
    county: string;
    status: string;
    provider_notes: string | null;
    class_url: string | null;
  }[] = [];
  let ccw: {
    id?: string;
    name: string;
    url: string | null;
    region: string | null;
    phone: string | null;
    notes: string | null;
    sort_order: number;
  }[] = [];

  if (client) {
    const [f, r, c, o] = await Promise.all([
      client.from("faq_entries").select("*").order("sort_order"),
      client.from("resource_links").select("*").order("sort_order"),
      client.from("sb25_county_availability").select("*").order("county"),
      client.from("ccw_orgs").select("*").order("sort_order"),
    ]);
    if (f.data?.length) faqs = f.data;
    if (r.data?.length) resources = r.data;
    counties = c.data ?? [];
    ccw = o.data ?? [];
  }

  return (
    <main className="mx-auto w-full max-w-4xl space-y-16 px-4 pb-20 pt-12 md:pt-14">
      <div>
        <Link href="/admin" className="text-sm text-amber">
          ← Admin
        </Link>
        <h1 className="mt-3 font-display text-4xl text-navy">Content</h1>
      </div>

      <section>
        <h2 className="font-display text-2xl text-navy">FAQs</h2>
        <form action={upsertFaq} className="mt-4 grid gap-3 border border-navy/10 p-4">
          <p className="text-sm text-muted">Add FAQ</p>
          <input name="page_key" placeholder="page_key (e.g. sb25-003)" required className="admin-input" />
          <input name="question" placeholder="Question" required className="admin-input" />
          <textarea name="answer" placeholder="Answer" required className="admin-input min-h-24" />
          <input name="sort_order" type="number" defaultValue={0} className="admin-input" />
          <label className="flex items-center gap-2 text-sm text-muted">
            <input name="published" type="checkbox" defaultChecked /> Published
          </label>
          <button type="submit" className="admin-btn">
            Save FAQ
          </button>
        </form>
        <ul className="mt-6 space-y-4">
          {faqs.map((faq) => (
            <li key={faq.id ?? faq.question} className="border-t border-navy/10 pt-4">
              <p className="text-navy">{faq.question}</p>
              <p className="mt-1 text-sm text-muted">{faq.answer}</p>
              {faq.id ? (
                <form action={deleteFaq} className="mt-2">
                  <input type="hidden" name="id" value={faq.id} />
                  <button type="submit" className="text-xs text-oxblood">
                    Delete
                  </button>
                </form>
              ) : null}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="font-display text-2xl text-navy">Resources</h2>
        <form action={upsertResource} className="mt-4 grid gap-3 border border-navy/10 p-4">
          <input name="slug" placeholder="slug" required className="admin-input" />
          <input name="name" placeholder="Name" required className="admin-input" />
          <input name="category" placeholder="category" defaultValue="advocacy" className="admin-input" />
          <input name="url" placeholder="URL" className="admin-input" />
          <textarea name="description" placeholder="Description" className="admin-input min-h-20" />
          <textarea name="note" placeholder="Note" className="admin-input" />
          <select name="colorado_contact" className="admin-input" defaultValue="">
            <option value="">CO contact unknown</option>
            <option value="true">Has CO contact</option>
            <option value="false">No CO contact</option>
          </select>
          <input name="sort_order" type="number" defaultValue={0} className="admin-input" />
          <label className="flex items-center gap-2 text-sm text-muted">
            <input name="published" type="checkbox" defaultChecked /> Published
          </label>
          <button type="submit" className="admin-btn">
            Save resource
          </button>
        </form>
        <p className="mt-4 text-sm text-muted">
          {resources.length} resources loaded (edit via SQL or re-upsert by slug).
        </p>
      </section>

      <section>
        <h2 className="font-display text-2xl text-navy">SB25-003 counties</h2>
        <form action={upsertCounty} className="mt-4 grid gap-3 border border-navy/10 p-4">
          <input name="county" placeholder="County" required className="admin-input" />
          <input name="status" placeholder="Status" defaultValue="unknown" className="admin-input" />
          <input name="class_url" placeholder="Class URL" className="admin-input" />
          <textarea name="provider_notes" placeholder="Notes" className="admin-input" />
          <button type="submit" className="admin-btn">
            Save county
          </button>
        </form>
        <ul className="mt-4 space-y-2 text-sm text-muted">
          {counties.map((c) => (
            <li key={c.id ?? c.county}>
              {c.county}: {c.status}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="font-display text-2xl text-navy">CCW orgs</h2>
        <form action={upsertCcwOrg} className="mt-4 grid gap-3 border border-navy/10 p-4">
          <input name="name" placeholder="Name" required className="admin-input" />
          <input name="url" placeholder="URL" className="admin-input" />
          <input name="region" placeholder="Region" className="admin-input" />
          <input name="phone" placeholder="Phone" className="admin-input" />
          <textarea name="notes" placeholder="Notes" className="admin-input" />
          <input name="sort_order" type="number" defaultValue={0} className="admin-input" />
          <label className="flex items-center gap-2 text-sm text-muted">
            <input name="published" type="checkbox" defaultChecked /> Published
          </label>
          <button type="submit" className="admin-btn">
            Save org
          </button>
        </form>
        <ul className="mt-4 space-y-2 text-sm text-muted">
          {ccw.map((o) => (
            <li key={o.id ?? o.name}>{o.name}</li>
          ))}
        </ul>
      </section>
    </main>
  );
}

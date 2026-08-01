import Link from "next/link";
import { deleteLitigation, upsertLitigation } from "@/lib/actions/admin";
import { createServiceClient } from "@/lib/supabase/clients";
import { FALLBACK_CASES } from "@/lib/data/fallback";

export default async function AdminLitigationPage() {
  const client = createServiceClient();
  let cases = FALLBACK_CASES;
  if (client) {
    const { data } = await client
      .from("litigation_cases")
      .select("*")
      .order("title");
    if (data?.length) {
      cases = data.map((row) => ({
        ...row,
        timeline: Array.isArray(row.timeline) ? row.timeline : [],
        sources: Array.isArray(row.sources) ? row.sources : [],
      }));
    }
  }

  return (
    <main className="mx-auto w-full max-w-4xl space-y-10 px-4 pb-20 pt-12 md:pt-14">
      <div>
        <Link href="/admin" className="text-sm text-amber">
          ← Admin
        </Link>
        <h1 className="mt-3 font-display text-4xl text-navy">Litigation</h1>
      </div>

      <form
        action={upsertLitigation}
        className="grid gap-3 border border-navy/10 p-4"
      >
        <p className="text-sm text-muted">Add / upsert by slug</p>
        <input name="slug" placeholder="slug" required className="admin-input" />
        <input name="title" placeholder="Title" required className="admin-input" />
        <input name="court" placeholder="Court" className="admin-input" />
        <input name="docket" placeholder="Docket" className="admin-input" />
        <textarea name="parties" placeholder="Parties" className="admin-input" />
        <input name="status" placeholder="Status" defaultValue="active" className="admin-input" />
        <textarea name="summary" placeholder="Summary" required className="admin-input min-h-24" />
        <textarea
          name="timeline"
          placeholder='Timeline JSON [{"date":"2025-09-02","label":"Filed"}]'
          defaultValue="[]"
          className="admin-input min-h-20 font-mono text-xs"
        />
        <textarea
          name="sources"
          placeholder='Sources JSON [{"label":"Justia","url":"https://..."}]'
          defaultValue="[]"
          className="admin-input min-h-20 font-mono text-xs"
        />
        <label className="flex items-center gap-2 text-sm text-muted">
          <input name="published" type="checkbox" defaultChecked /> Published
        </label>
        <button type="submit" className="admin-btn">
          Save case
        </button>
      </form>

      <ul className="space-y-6">
        {cases.map((c) => (
          <li key={c.slug} className="border-t border-navy/10 pt-4">
            <p className="font-display text-xl text-navy">{c.title}</p>
            <p className="text-sm text-muted">{c.slug}</p>
            <p className="mt-2 text-sm text-muted">{c.summary}</p>
            {c.id ? (
              <form action={deleteLitigation} className="mt-2">
                <input type="hidden" name="id" value={c.id} />
                <button type="submit" className="text-xs text-oxblood">
                  Delete
                </button>
              </form>
            ) : null}
          </li>
        ))}
      </ul>
    </main>
  );
}

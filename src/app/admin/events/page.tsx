import Link from "next/link";
import { deleteEvent, upsertEvent } from "@/lib/actions/admin";
import { createServiceClient } from "@/lib/supabase/clients";

export default async function AdminEventsPage() {
  const client = createServiceClient();
  let events: {
    id?: string;
    title: string;
    starts_at: string | null;
    location: string | null;
    url: string | null;
    description: string;
  }[] = [];
  if (client) {
    const { data } = await client
      .from("events")
      .select("*")
      .order("starts_at", { ascending: true, nullsFirst: false });
    events = data ?? [];
  }

  return (
    <main className="mx-auto w-full max-w-3xl space-y-10 px-4 pb-20 pt-12 md:pt-14">
      <div>
        <Link href="/admin" className="text-sm text-amber">
          ← Admin
        </Link>
        <h1 className="mt-3 font-display text-4xl text-navy">Events</h1>
      </div>

      <form action={upsertEvent} className="grid gap-3 border border-navy/10 p-4">
        <input name="title" placeholder="Title" required className="admin-input" />
        <input name="starts_at" type="datetime-local" className="admin-input" />
        <input name="location" placeholder="Location" className="admin-input" />
        <input name="url" placeholder="URL" className="admin-input" />
        <textarea name="description" placeholder="Description" className="admin-input min-h-24" />
        <label className="flex items-center gap-2 text-sm text-muted">
          <input name="published" type="checkbox" defaultChecked /> Published
        </label>
        <button type="submit" className="admin-btn">
          Save event
        </button>
      </form>

      <ul className="space-y-4">
        {events.length === 0 ? (
          <li className="text-muted">No events yet.</li>
        ) : (
          events.map((event) => (
            <li key={event.id ?? event.title} className="border-t border-navy/10 pt-4">
              <p className="text-navy">{event.title}</p>
              {event.starts_at ? (
                <p className="text-sm text-muted">
                  {new Date(event.starts_at).toLocaleString()}
                </p>
              ) : null}
              {event.id ? (
                <form action={deleteEvent} className="mt-2">
                  <input type="hidden" name="id" value={event.id} />
                  <button type="submit" className="text-xs text-oxblood">
                    Delete
                  </button>
                </form>
              ) : null}
            </li>
          ))
        )}
      </ul>
    </main>
  );
}

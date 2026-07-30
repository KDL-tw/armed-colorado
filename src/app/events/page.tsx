import type { Metadata } from "next";
import Link from "next/link";
import { getEvents } from "@/lib/data/queries";

export const metadata: Metadata = { title: "Events" };

export default async function EventsPage() {
  const events = await getEvents();

  return (
    <main className="mx-auto w-full max-w-3xl px-4 pb-20 pt-28">
      <p className="text-sm uppercase tracking-[0.2em] text-amber">Calendar</p>
      <h1 className="mt-3 font-display text-4xl text-cream md:text-5xl">
        Events
      </h1>
      <p className="mt-4 text-silver">
        Trainings, lobby days, and community events. Managed in admin — no
        calendar sync yet.
      </p>

      {events.length === 0 ? (
        <div className="mt-12 border border-dashed border-silver/30 px-6 py-12 text-center">
          <p className="font-display text-2xl text-cream">No upcoming events</p>
          <p className="mt-3 text-sm text-silver">
            Add events in{" "}
            <Link href="/admin/events" className="text-amber underline">
              Admin → Events
            </Link>
            .
          </p>
        </div>
      ) : (
        <ul className="mt-10 space-y-6">
          {events.map((event) => (
            <li
              key={event.id ?? event.title}
              className="border-t border-silver/20 pt-6"
            >
              <h2 className="font-display text-2xl text-cream">{event.title}</h2>
              {event.starts_at ? (
                <p className="mt-1 text-sm text-amber">
                  {new Date(event.starts_at).toLocaleString()}
                </p>
              ) : null}
              {event.location ? (
                <p className="mt-1 text-sm text-silver-muted">{event.location}</p>
              ) : null}
              <p className="mt-3 text-silver">{event.description}</p>
              {event.url ? (
                <a
                  href={event.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-block text-amber underline"
                >
                  Event link →
                </a>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

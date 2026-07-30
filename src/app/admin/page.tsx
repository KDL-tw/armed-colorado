import Link from "next/link";
import { isSupabaseConfigured } from "@/lib/supabase/clients";

const LINKS = [
  {
    href: "/admin/content",
    title: "Content",
    desc: "FAQs, resources, CCW orgs, SB25-003 counties",
  },
  {
    href: "/admin/litigation",
    title: "Litigation",
    desc: "Case tracker CRUD",
  },
  { href: "/admin/events", title: "Events", desc: "Upcoming events list" },
  {
    href: "/admin/analytics",
    title: "Analytics",
    desc: "Page views & alert signups",
  },
  {
    href: "/admin/health",
    title: "API health",
    desc: "Umbrella, Supabase, Resend status",
  },
];

export default function AdminHomePage() {
  const configured = isSupabaseConfigured();

  return (
    <main className="mx-auto w-full max-w-4xl px-4 pb-20 pt-28">
      <h1 className="font-display text-4xl text-cream">Admin</h1>
      <p className="mt-3 max-w-2xl text-sm text-silver">
        No login in v1. Mutations use the server service-role key. Keep this URL
        private until auth is added.
      </p>
      {!configured ? (
        <p className="mt-4 border border-amber/40 bg-amber/10 px-4 py-3 text-sm text-amber">
          Supabase env vars are not set. Public pages use fallbacks; admin writes
          will fail until you connect the TSOR free project.
        </p>
      ) : null}
      <ul className="mt-10 grid gap-4 sm:grid-cols-2">
        {LINKS.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="block border border-silver/20 bg-navy/50 px-5 py-5 transition hover:border-amber"
            >
              <p className="font-display text-xl text-cream">{link.title}</p>
              <p className="mt-2 text-sm text-silver">{link.desc}</p>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}

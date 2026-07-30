import Link from "next/link";
import {
  getAlertSubscriberCount,
  getPageViewsSummary,
  isSupabaseConfigured,
} from "@/lib/data/queries";

export default async function AdminAnalyticsPage() {
  const configured = isSupabaseConfigured();
  const views = configured ? await getPageViewsSummary() : [];
  const alertCount = configured ? await getAlertSubscriberCount() : 0;

  return (
    <main className="mx-auto w-full max-w-3xl px-4 pb-20 pt-28">
      <Link href="/admin" className="text-sm text-amber">
        ← Admin
      </Link>
      <h1 className="mt-3 font-display text-4xl text-cream">Analytics</h1>
      <p className="mt-3 text-sm text-silver">
        Simple usage signals from page-view beacons and alert signups. Vercel
        Analytics is also enabled on the public site.
      </p>

      {!configured ? (
        <p className="mt-6 text-amber">Connect Supabase to store analytics.</p>
      ) : (
        <>
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            <div className="border border-silver/20 p-5">
              <p className="text-sm text-silver-muted">Alert subscribers</p>
              <p className="mt-2 font-display text-4xl text-amber">{alertCount}</p>
            </div>
            <div className="border border-silver/20 p-5">
              <p className="text-sm text-silver-muted">Tracked paths</p>
              <p className="mt-2 font-display text-4xl text-amber">
                {views.length}
              </p>
            </div>
          </div>

          <h2 className="mt-12 font-display text-2xl text-cream">Top paths</h2>
          {views.length === 0 ? (
            <p className="mt-4 text-silver">No page views recorded yet.</p>
          ) : (
            <ul className="mt-4 divide-y divide-silver/15">
              {views.slice(0, 25).map((row) => (
                <li
                  key={row.path}
                  className="flex items-center justify-between py-3 text-sm"
                >
                  <span className="text-cream">{row.path}</span>
                  <span className="text-silver">{row.count}</span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </main>
  );
}

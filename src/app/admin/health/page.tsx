import Link from "next/link";
import { refreshHealthChecks } from "@/lib/actions/admin";
import { getUmbrellaHealth } from "@/lib/umbrella/client";
import {
  createServiceClient,
  isSupabaseConfigured,
} from "@/lib/supabase/clients";

export default async function AdminHealthPage() {
  const umbrella = getUmbrellaHealth();
  const supabaseConfigured = isSupabaseConfigured();
  const resendConfigured = Boolean(process.env.RESEND_API_KEY);
  const client = createServiceClient();
  let stored: { service: string; status: string; detail: string | null; checked_at: string }[] =
    [];
  if (client) {
    const { data } = await client
      .from("api_health_checks")
      .select("*")
      .order("service");
    stored = data ?? [];
  }

  const live = [
    {
      service: "umbrella",
      status: umbrella.status,
      detail: umbrella.detail,
    },
    {
      service: "supabase",
      status: supabaseConfigured && client ? "ok" : "unconfigured",
      detail: supabaseConfigured
        ? client
          ? "Anon + service role available"
          : "Anon set; service role missing"
        : "NEXT_PUBLIC_SUPABASE_* not set",
    },
    {
      service: "resend",
      status: resendConfigured ? "ok" : "unconfigured",
      detail: resendConfigured
        ? "RESEND_API_KEY present"
        : "Alerts store-only",
    },
  ];

  return (
    <main className="mx-auto w-full max-w-3xl px-4 pb-20 pt-28">
      <Link href="/admin" className="text-sm text-amber">
        ← Admin
      </Link>
      <h1 className="mt-3 font-display text-4xl text-cream">API health</h1>
      <p className="mt-3 text-sm text-silver">
        Live env checks plus optional rows in <code>api_health_checks</code>.
      </p>

      <ul className="mt-10 space-y-4">
        {live.map((row) => (
          <li
            key={row.service}
            className="flex flex-wrap items-start justify-between gap-3 border border-silver/20 px-4 py-4"
          >
            <div>
              <p className="font-semibold capitalize text-cream">{row.service}</p>
              <p className="mt-1 text-sm text-silver">{row.detail}</p>
            </div>
            <span
              className={`text-xs uppercase tracking-wider ${
                row.status === "ok" ? "text-amber" : "text-oxblood"
              }`}
            >
              {row.status}
            </span>
          </li>
        ))}
      </ul>

      {client ? (
        <form action={refreshHealthChecks} className="mt-8">
          <button type="submit" className="admin-btn">
            Persist health snapshot
          </button>
        </form>
      ) : null}

      {stored.length > 0 ? (
        <>
          <h2 className="mt-12 font-display text-2xl text-cream">
            Stored snapshots
          </h2>
          <ul className="mt-4 space-y-2 text-sm text-silver">
            {stored.map((row) => (
              <li key={row.service}>
                {row.service}: {row.status} — {row.detail} (
                {new Date(row.checked_at).toLocaleString()})
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </main>
  );
}

"use client";

import { useState } from "react";

const TOPICS = [
  { id: "gun-bills", label: "Gun bills" },
  { id: "hearings", label: "Hearings / testimony windows" },
  { id: "litigation", label: "Litigation updates" },
  { id: "events", label: "Events" },
];

export default function AlertsPage() {
  const [email, setEmail] = useState("");
  const [topics, setTopics] = useState<string[]>(["gun-bills"]);
  const [status, setStatus] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setStatus(null);
    try {
      const res = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, topics }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        message?: string;
        error?: string;
      };
      if (!res.ok || !data.ok) {
        setStatus(data.error ?? "Something went wrong.");
      } else {
        setStatus(
          data.message ??
            "You’re signed up. We’ll email when delivery is configured.",
        );
        setEmail("");
      }
    } catch {
      setStatus("Network error.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-xl px-4 pb-20 pt-28">
      <p className="text-sm uppercase tracking-[0.2em] text-amber">Alerts</p>
      <h1 className="mt-3 font-display text-4xl text-cream">
        Gun bill alerts
      </h1>
      <p className="mt-4 text-silver">
        Sign up for email alerts on Colorado firearms legislation, hearings, and
        related updates. Delivery uses Resend when configured; otherwise we
        store your address for later.
      </p>

      <form onSubmit={onSubmit} className="mt-10 space-y-6">
        <label className="block">
          <span className="text-sm text-silver">Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-2 w-full border border-silver/30 bg-navy-deep px-3 py-3 text-cream outline-none focus:border-amber"
            placeholder="you@example.com"
          />
        </label>
        <fieldset>
          <legend className="text-sm text-silver">Topics</legend>
          <div className="mt-3 space-y-2">
            {TOPICS.map((t) => (
              <label key={t.id} className="flex items-center gap-2 text-cream">
                <input
                  type="checkbox"
                  checked={topics.includes(t.id)}
                  onChange={(e) => {
                    setTopics((prev) =>
                      e.target.checked
                        ? [...prev, t.id]
                        : prev.filter((x) => x !== t.id),
                    );
                  }}
                />
                {t.label}
              </label>
            ))}
          </div>
        </fieldset>
        <button
          type="submit"
          disabled={pending}
          className="bg-oxblood px-6 py-3 text-sm font-semibold text-cream transition hover:bg-oxblood-deep disabled:opacity-60"
        >
          {pending ? "Saving…" : "Sign up"}
        </button>
        {status ? <p className="text-sm text-silver">{status}</p> : null}
      </form>
    </main>
  );
}

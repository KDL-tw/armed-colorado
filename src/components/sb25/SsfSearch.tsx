"use client";
import { useMemo, useState } from "react";
import type { SsfFirearm, SsfCategory } from "@/lib/sb25/types";

const CATS: { key: "all" | SsfCategory; label: string }[] = [
  { key: "all", label: "All" },
  { key: "rifle", label: "Rifles" },
  { key: "shotgun", label: "Shotguns" },
  { key: "handgun", label: "Handguns" },
];

/**
 * Client-side text + category filter over the SSF living list (~876 items —
 * trivially client-filterable, no server round-trip). Controlled inputs; pure
 * filter of the committed data. Styled to the site's light theme.
 */
export function SsfSearch({ firearms, version }: { firearms: SsfFirearm[]; version: string }) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<"all" | SsfCategory>("all");
  const total = firearms.length;

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return firearms.filter(
      (f) =>
        (cat === "all" || f.category === cat) &&
        (needle === "" || f.name.toLowerCase().includes(needle)),
    );
  }, [firearms, q, cat]);

  return (
    <div className="rounded-md border border-silver bg-cream p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-display text-xl text-navy">Specified Semiautomatic Firearms List</h3>
        <span className="text-xs text-silver-muted">FDD guidance · {version}</span>
      </div>

      <div className="mb-3 flex flex-col gap-2 sm:flex-row">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search make or model…"
          className="w-full rounded-md border border-silver bg-white px-3 py-2 text-sm text-navy placeholder:text-silver-muted focus:border-amber focus:outline-none sm:flex-1"
        />
        <div className="flex flex-wrap gap-1">
          {CATS.map((c) => (
            <button
              key={c.key}
              onClick={() => setCat(c.key)}
              className={`rounded-md px-3 py-2 text-sm font-semibold transition-colors ${
                cat === c.key
                  ? "bg-oxblood text-white"
                  : "border border-silver bg-white text-navy hover:bg-cream"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <p className="mb-2 text-sm text-muted">
        Showing <strong className="text-navy">{filtered.length}</strong> of {total} firearms
      </p>

      {filtered.length === 0 ? (
        <div className="rounded-md border border-dashed border-silver p-6 text-center text-muted">
          No firearms match. Try clearing the search or picking another category.
        </div>
      ) : (
        <div className="grid max-h-[28rem] gap-1 overflow-auto sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((f) => (
            <div
              key={f.name}
              className="flex items-center justify-between gap-2 rounded-md border border-silver/40 bg-white px-3 py-2 text-sm"
            >
              <span className="text-navy">
                {f.name}
                {f.inAddendum ? <span className="ml-2 text-xs text-silver-muted">(addendum)</span> : null}
              </span>
              <span className="shrink-0 text-xs uppercase tracking-wide text-silver-muted">{f.category}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

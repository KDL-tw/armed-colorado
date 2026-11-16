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
 * Client-side text + category filter over the SSF living list. ~240 items —
 * trivially client-filterable, no server round-trip. Controlled inputs; pure
 * filter of the committed data.
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
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-lg font-bold text-white">Specified Semiautomatic Firearms list</h3>
        <span className="text-xs text-white/50">FDD guidance · {version}</span>
      </div>

      <div className="mb-3 flex flex-col gap-2 sm:flex-row">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search make or model…"
          className="w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 sm:flex-1"
        />
        <div className="flex gap-1">
          {CATS.map((c) => (
            <button
              key={c.key}
              onClick={() => setCat(c.key)}
              className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                cat === c.key ? "bg-white text-black" : "bg-white/5 text-white/70 hover:bg-white/10"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-2 text-sm text-white/60">
        Showing <span className="font-bold text-white">{filtered.length}</span> of {total} firearms
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-white/15 p-6 text-center text-white/50">
          No firearms match. Try clearing the search or picking another category.
        </div>
      ) : (
        <ul className="grid max-h-[28rem] list-none gap-1 overflow-auto sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((f) => (
            <li key={f.name} className="flex items-center justify-between rounded-lg bg-white/[0.03] px-3 py-2 text-sm">
              <span className="text-white">
                {f.name}
                {f.inAddendum ? <span className="ml-2 text-xs text-white/40">(addendum)</span> : null}
              </span>
              <span className="text-xs uppercase tracking-wide text-white/40">{f.category}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

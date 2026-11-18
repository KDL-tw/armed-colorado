/**
 * Data-freshness stamps (JOB side).
 *
 * Every fetch/refresh job that rewrites a data file on disk stamps two fields
 * into that file:
 *
 *   - fetchedAt — every successful run (the data was *checked*).
 *   - updatedAt — only when the file's content actually changed vs. the
 *     previous file (the data was *updated*); otherwise the previous file's
 *     updatedAt is carried forward (or omitted when it had none).
 *
 * The site's "Last checked / Last updated" note reads these fields first
 * (see src/lib/data/freshness.ts), so the note moves as soon as a job writes
 * the file — no git commit, no rebuild, no restart.
 *
 * Usage (in a fetch script):
 *   const stamps = stampFreshness(prevParsedFileOrNull, newData);
 *   Object.assign(newData, stamps);
 *   writeFileSync(out, JSON.stringify(newData, null, 2) + "\n");
 *
 * Verify-only jobs (e.g. scripts/fetch-chp-crs.ts) must NOT use this helper:
 * they load the whole object and re-stamp only `fetchedAt`, which carries any
 * existing `updatedAt` forward automatically.
 */

export interface FreshnessStamps {
  /** ISO — set to "now" on every call (the job checked/refreshed the data). */
  fetchedAt: string;
  /** ISO — present only when the content changed vs. `prev` (or `prev` absent). */
  updatedAt?: string;
}

/** Canonical form for order-independent content comparison: keys sorted at
 *  every level, the freshness fields stripped at every level. */
function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value !== null && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(value as Record<string, unknown>).sort()) {
      if (k === "fetchedAt" || k === "updatedAt") continue;
      out[k] = canonical((value as Record<string, unknown>)[k]);
    }
    return out;
  }
  return value;
}

/**
 * Compute the freshness stamps to merge into `next` before writing it.
 *
 * @param prev the previously written file content (parsed JSON), or
 *             null/undefined on a first run.
 * @param next the new content object (may already carry a `fetchedAt` — it is
 *             stripped from the comparison).
 */
export function stampFreshness(prev: unknown, next: object): FreshnessStamps {
  const now = new Date().toISOString();
  const changed =
    prev == null ||
    JSON.stringify(canonical(prev)) !== JSON.stringify(canonical(next));
  const prevUpdatedAt =
    prev !== null && typeof prev === "object" && !Array.isArray(prev)
      ? (prev as { updatedAt?: unknown }).updatedAt
      : undefined;

  const out: FreshnessStamps = { fetchedAt: now };
  if (changed) {
    out.updatedAt = now;
  } else if (typeof prevUpdatedAt === "string" && prevUpdatedAt.length > 0) {
    out.updatedAt = prevUpdatedAt;
  }
  return out;
}

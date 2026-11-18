/**
 * Data-freshness stamps (JOB side).
 *
 * Fetch jobs stamp two fields into a data file — but ONLY when the content
 * actually changed. No-op runs write nothing (user rule: no no-op commits,
 * 2026-11-18), so the git history of a data file contains real changes only:
 *
 *   - fetchedAt — when the job re-fetched and committed a content change.
 *   - updatedAt — when the file's content last changed (same instant for
 *     these jobs; a separate field so human-edited files can carry their
 *     own update time too).
 *
 * The site's note lines: "Last checked" comes from the local check record
 * (src/lib/data/check-record.ts — written on EVERY successful run, committed
 * or not); "Last updated" comes from these fields / git (see
 * src/lib/data/freshness.ts).
 *
 * Usage (in a fetch script):
 *   const stamps = stampFreshness(prevParsedFileOrNull, newData);
 *   if (!stamps.changed) { recordCheck(files, "up-to-date"); process.exit(0); }
 *   Object.assign(newData, stamps);
 *   writeFileSync(out, JSON.stringify(newData, null, 2) + "\n");
 *
 * Verify-only jobs (e.g. scripts/fetch-chp-crs.ts) never write: they compare
 * live source vs. committed data and recordCheck() on success, so both a
 * clean verify and a mismatch leave the tree untouched.
 */

export interface FreshnessStamps {
  /** ISO — set to "now" on every call (the job checked/refreshed the data). */
  fetchedAt: string;
  /** ISO — present only when the content changed vs. `prev` (or `prev` absent). */
  updatedAt?: string;
  /** True when the content (stamps stripped) differs from `prev`, or `prev` was
   *  absent. No-op runs MUST use this to skip their write entirely: no file
   *  write, no dirty tree, no no-op commit (user rule 2026-11-18). */
  changed: boolean;
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

  const out: FreshnessStamps = { fetchedAt: now, changed };
  if (changed) {
    out.updatedAt = now;
  } else if (typeof prevUpdatedAt === "string" && prevUpdatedAt.length > 0) {
    out.updatedAt = prevUpdatedAt;
  }
  return out;
}

/**
 * Server-side data-freshness helpers.
 *
 * For each pulled-data file (the committed output of a fetch/refresh job) we
 * report two timestamps:
 *
 *   - checkedAt — when the job last *checked* the data. Primary source: the
 *     file's `fetchedAt` field, which the fetch scripts stamp on every
 *     successful run (including verify-and-no-op runs that only re-confirm
 *     the data is current).
 *
 *   - updatedAt — when the file's *content* last changed. Primary source: the
 *     file's `updatedAt` field, which the fetch scripts stamp ONLY when the
 *     content actually differs from the previous file (see
 *     src/lib/data/data-stamp.ts). Files that carry no such fields (the
 *     gun-bill catalog — JSON array — and the hand-authored
 *     data/sb25/process.json) fall back to the git committer date of the
 *     last commit that touched the file, then to the file mtime, so the UI
 *     never shows garbage.
 *
 * The data pages render per request and pass their already-parsed data
 * object, so the note reflects the file on disk at request time: when a job
 * rewrites the data file, the note updates on the next page load — no
 * rebuild, no restart.
 *
 * Server-only: uses child_process (git) and fs. Do not import from a
 * client component.
 */
import { execFile } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

/** Root the data files are resolved against — same convention the data
 *  loaders use (process.cwd()). */
function root(): string {
  return process.cwd();
}

/** TTL git cache. Git history moves under a long-running server (the
 *  auto-pull cron lands merged refresh PRs — see scripts/auto-pull.sh), so a
 *  per-process-forever cache would serve stale commit dates; 60 s bounds the
 *  staleness while avoiding one `git log` per file per request. */
const GIT_TTL_MS = 60_000;
const gitCommitCache = new Map<string, { iso: string | null; at: number }>();

/**
 * Commutter date (ISO-strict) of the last commit that touched `relFile`, or
 * null when git is unavailable or the file was never committed.
 */
async function gitLastCommitIso(relFile: string): Promise<string | null> {
  const hit = gitCommitCache.get(relFile);
  if (hit && Date.now() - hit.at < GIT_TTL_MS) return hit.iso;
  const r = root();
  let iso: string | null = null;
  if (existsSync(path.join(r, ".git"))) {
    try {
      const { stdout } = await execFileAsync(
        "git",
        ["-C", r, "log", "-1", "--format=%cI", "--", relFile],
      );
      iso = stdout.trim() || null;
    } catch {
      iso = null;
    }
  }
  gitCommitCache.set(relFile, { iso, at: Date.now() });
  return iso;
}

function isValidIso(v: unknown): v is string {
  return typeof v === "string" && v.length > 0 && !Number.isNaN(Date.parse(v));
}

function fileMtimeIso(relFile: string): string {
  try {
    const p = path.join(root(), relFile);
    if (existsSync(p)) return statSync(p).mtime.toISOString();
  } catch {
    /* ignore — fall through */
  }
  // Epoch zero renders as a valid (1970) stamp rather than "Invalid Date".
  return new Date(0).toISOString();
}

/** Top-level freshness fields, when the parsed content is an object that
 *  carries them (arrays — e.g. the gun-bill catalog — carry none). */
function topLevelStamps(data: unknown): { fetchedAt?: string; updatedAt?: string } {
  if (data !== null && typeof data === "object" && !Array.isArray(data)) {
    const o = data as Record<string, unknown>;
    return {
      fetchedAt: isValidIso(o.fetchedAt) ? (o.fetchedAt as string) : undefined,
      updatedAt: isValidIso(o.updatedAt) ? (o.updatedAt as string) : undefined,
    };
  }
  return {};
}

export interface DataFreshness {
  /** When the job last checked/verified the data (file fetchedAt → updatedAt → git → mtime). */
  checkedAt: string;
  /** When the data content last changed (file updatedAt → git → mtime). */
  updatedAt: string;
}

/**
 * Resolve the checked/updated stamps for a pulled-data file.
 *
 * @param file  path relative to the project root (e.g. "data/chp/crs.json") —
 *              used for the git/mtime fallback.
 * @param data  parsed JSON of that file. Pages have usually already loaded it
 *              — pass it to avoid a second parse. When omitted, the helper
 *              reads the file itself.
 */
export async function getDataFreshness(opts: {
  file: string;
  data?: unknown;
}): Promise<DataFreshness> {
  let parsed: unknown = opts.data;
  if (parsed === undefined) {
    try {
      parsed = JSON.parse(readFileSync(path.join(root(), opts.file), "utf8"));
    } catch {
      parsed = null; // missing/unreadable file — git/mtime fallbacks only
    }
  }
  const stamps = topLevelStamps(parsed);
  const fetched = stamps.fetchedAt ?? null;
  const updated = stamps.updatedAt ?? null;
  const fallback = (await gitLastCommitIso(opts.file)) ?? fileMtimeIso(opts.file);
  const updatedAt = updated ?? fallback;
  const checkedAt = fetched ?? updatedAt;
  return { checkedAt, updatedAt };
}

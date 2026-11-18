/**
 * Server-side data-freshness helpers.
 *
 * For each pulled-data file (the committed output of a fetch/refresh job) we
 * report two timestamps:
 *
 *   - checkedAt — when the job last *checked* the data. This is the file's
 *     `fetchedAt` field, which the fetch scripts stamp on every successful
 *     run (including verify-and-no-op runs that only re-confirm the data is
 *     current). When a file has no `fetchedAt` (e.g. the gun-bill catalog),
 *     we fall back to updatedAt.
 *
 *   - updatedAt — when the file's *content* last changed. We read this from
 *     git (the committer date of the last commit that touched the file),
 *     because content changes in this project are always committed. Falls
 *     back to `fetchedAt`, then to the file mtime, when git is unavailable
 *     (e.g. a deploy without a .git dir) so the UI never shows garbage.
 *
 * Server-only: uses child_process (git) and fs. Do not import from a
 * client component.
 */
import { execFile } from "node:child_process";
import { existsSync, statSync } from "node:fs";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

/** Root the data files are resolved against — same convention the data
 *  loaders use (process.cwd()). */
function root(): string {
  return process.cwd();
}

/** Module-level cache so each file's git lookup runs at most once per
 *  process (pages render per-request but share the server process). */
const gitCommitCache = new Map<string, string | null>();

/**
 * Commutter date (ISO-strict) of the last commit that touched `relFile`, or
 * null when git is unavailable or the file was never committed.
 */
async function gitLastCommitIso(relFile: string): Promise<string | null> {
  if (gitCommitCache.has(relFile)) return gitCommitCache.get(relFile) ?? null;
  const r = root();
  if (!existsSync(path.join(r, ".git"))) {
    gitCommitCache.set(relFile, null);
    return null;
  }
  try {
    const { stdout } = await execFileAsync(
      "git",
      ["-C", r, "log", "-1", "--format=%cI", "--", relFile],
    );
    const iso = stdout.trim();
    gitCommitCache.set(relFile, iso || null);
    return iso || null;
  } catch {
    gitCommitCache.set(relFile, null);
    return null;
  }
}

function isValidIso(v: string | null | undefined): v is string {
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

export interface DataFreshness {
  /** When the job last checked/verified the data (fetchedAt, or updatedAt). */
  checkedAt: string;
  /** When the file's content last changed (git, or fallback). */
  updatedAt: string;
}

/**
 * Resolve the checked/updated stamps for a pulled-data file.
 *
 * @param file      path relative to the project root (e.g. "data/chp/crs.json")
 * @param fetchedAt the file's `fetchedAt` ISO string, if it has one
 */
export async function getDataFreshness(opts: {
  file: string;
  fetchedAt?: string | null;
}): Promise<DataFreshness> {
  const { file, fetchedAt } = opts;
  const checked = isValidIso(fetchedAt) ? fetchedAt : null;
  const updatedAt =
    (await gitLastCommitIso(file)) ?? checked ?? fileMtimeIso(file);
  const checkedAt = checked ?? updatedAt;
  return { checkedAt, updatedAt };
}

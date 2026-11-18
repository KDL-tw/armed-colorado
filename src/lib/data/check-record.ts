/**
 * Local freshness check record (gitignored — never committed).
 *
 * The freshness loops (scripts/freshness-loop.sh + the SSF updater) record
 * every SUCCESSFUL check of a data file here, whether or not the content
 * changed. The site's "Last checked" note line reads this record (see
 * src/lib/data/freshness.ts), so "we verified this today" is visible on the
 * site WITHOUT a no-op commit — the user's standing rule: no-op runs must
 * not produce commits.
 *
 * Semantics:
 *   - "Last checked"  = this record (latest verification; moves every run)
 *   - "Last updated"  = committed content change (file updatedAt / git)
 * The record is a liveness signal, not the history of record — the git
 * history of the data file is. If .cache is wiped, "checked" falls back to
 * the committed values (graceful).
 *
 * Used by both job scripts (recordCheck) and the server (readCheckRecord).
 * Plain fs only — safe on both sides.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const RECORD_REL = path.join(".cache", "freshness.json");

interface CheckRecordEntry {
  checkedAt: string;
  result: string;
}
type CheckRecord = Record<string, CheckRecordEntry>;

function recordPath(): string {
  return path.join(process.cwd(), RECORD_REL);
}

/**
 * Record a successful check of one or more data files.
 * @param files  repo-relative paths, e.g. "data/chp/crs.json"
 * @param result "up-to-date" | "updated" | "verified" | … (free text, for logs)
 */
export function recordCheck(files: string[], result: string = "checked"): void {
  let rec: CheckRecord = {};
  const p = recordPath();
  if (existsSync(p)) {
    try {
      rec = JSON.parse(readFileSync(p, "utf8")) as CheckRecord;
    } catch {
      rec = {}; // corrupt record — start fresh (it's a liveness signal)
    }
  }
  const now = new Date().toISOString();
  for (const f of files) rec[f] = { checkedAt: now, result };
  mkdirSync(path.dirname(p), { recursive: true });
  writeFileSync(p, JSON.stringify(rec, null, 2) + "\n", "utf8");
}

/** Latest successful-check time for a file (ISO), or null when unknown. */
export function readCheckRecord(file: string): string | null {
  try {
    const rec = JSON.parse(readFileSync(recordPath(), "utf8")) as CheckRecord;
    const v = rec[file]?.checkedAt;
    return typeof v === "string" && !Number.isNaN(Date.parse(v)) ? v : null;
  } catch {
    return null;
  }
}

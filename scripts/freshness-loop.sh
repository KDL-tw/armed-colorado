#!/usr/bin/env bash
# Armed Colorado data-freshness loop — one source per invocation.
#
# usage: scripts/freshness-loop.sh <chp|districts|committees>
#
# Implements the standing data loop (user requirement 2026-11-18):
#   auto-detect  → the fetch/verify scripts compare the live source against
#                  the committed data and write ONLY when content changed
#   site update  → the data pages are force-dynamic; a committed change is
#                  live on the next page load (no rebuild, no restart)
#   note update  → every successful check is recorded in .cache/freshness.json
#                  (gitignored) and drives the "Last checked" line;
#                  "Last updated" moves only on a committed content change
#   commit+push  → content changes are validated, committed (per-source
#                  message) and pushed to origin/main
#
# STANDING RULE: no-op runs produce NO COMMITS and NO DIRTY TREE. A clean
# check leaves the repo exactly as it found it (the check record aside), so
# the git history of each data file contains real changes only — the
# historical-analysis guarantee.
#
# Guard rails (each skips the run; the loop never clobbers local work):
#   - local main ahead of origin (unpushed commits)   → skip (push first)
#   - uncommitted edits (incl. untracked) under the
#     source's data paths                              → skip
#
# Notifications (hermes send → Signal home channel) fire ONLY when something
# happened or needs attention: content committed, fetch/verify failure, new
# redistricting plan, push failure, or a guard-skip (deduped to one per
# source per 24 h). A clean no-op check is silent.
#
# Cron (noether's crontab):
#   10 7 * * *   chp         (daily; CBI pages are cheap)
#   30 6 * * 1   districts   (weekly; heavy shapefile re-fetch)
#   30 6 * * 2   committees  (weekly; ~130 legislator pages, polite sleeps)
# The SSF list runs its own loop: scripts/check-sb25-ssf.ts via the existing
# daily hermes cron (sb25-ssf-updater) — same discipline, pre-dating this.
# The gun-bill catalog is intentionally NOT looped: session activity would
# produce a real commit nearly daily (user rule: no commit floods).
set -uo pipefail

REPO=/home/noether/renhorne/armed-colorado
LOG="$REPO/.cache/freshness-loop.log"
SOURCE="${1:?usage: freshness-loop.sh <chp|districts|committees>}"
SKIP_FLAG="$REPO/.cache/skip-notified-$SOURCE"
cd "$REPO" || exit 1
mkdir -p .cache

log() { echo "[$(date -Is)] [$SOURCE] $*"; }

notify() {
  local f
  f=$(mktemp /tmp/ac-freshness-notify.XXXXXX)
  printf 'Armed Colorado [%s]: %s\n' "$SOURCE" "$1" > "$f"
  if command -v hermes >/dev/null 2>&1; then
    hermes send --to signal --file "$f" >> "$LOG" 2>&1 \
      || log "WARN: hermes send failed (gateway down?)"
  else
    log "WARN: hermes CLI not on PATH — notification skipped"
  fi
  rm -f "$f"
}

# At most one skip notice per source per 24 h (no nagging).
skip_notify() {
  local now last
  now=$(date +%s)
  if [ -f "$SKIP_FLAG" ]; then
    last=$(cat "$SKIP_FLAG" 2>/dev/null || echo 0)
    case "$last" in *[!0-9]* | '') last=0 ;; esac
    if [ $((now - last)) -lt 86400 ]; then return 0; fi
  fi
  echo "$now" > "$SKIP_FLAG"
  notify "$1"
}

git fetch origin main >> "$LOG" 2>&1 || log "WARN: git fetch failed — using stale origin/main ref"

# --- guard 1: unpushed local commits (never push the user's unpushed work) --
AHEAD=$(git rev-list --count origin/main..main 2>/dev/null || echo "?")
if [ "$AHEAD" != "0" ]; then
  log "SKIP: local main is $AHEAD commit(s) ahead of origin/main — push first"
  skip_notify "loop skipped: local main has $AHEAD unpushed commit(s). Run git push to unblock automatic commits."
  exit 0
fi

# --- guard 2: uncommitted local edits under this source's data paths --------
case "$SOURCE" in
  chp)        DATA_PATHS="data/chp" ;;
  districts)  DATA_PATHS="data/districts" ;;
  committees) DATA_PATHS="data/committee-catalog.json data/committee-data data/committee-photos" ;;
esac
if [ -n "$(git status --porcelain $DATA_PATHS)" ]; then
  log "SKIP: uncommitted local edits under $DATA_PATHS"
  skip_notify "loop skipped: uncommitted local edits under $DATA_PATHS (the loop never touches in-progress work)."
  exit 0
fi

# --- fetch / verify ----------------------------------------------------------
case "$SOURCE" in
  chp)
    # CRS: verify-only, never writes. Failure = CBI statute list or fee totals
    # changed → a human re-verifies the researched content. The other two
    # sources run independently and still commit if their content changed.
    if ! npm run fetch-chp-crs >> "$LOG" 2>&1; then
      notify "CRS statute verify FAILED — the CBI statute list or fee totals may have changed; the researched content in data/chp/crs.json needs human re-verification before committing. Log tail: $(tail -n 2 "$LOG" | tr '\n' ' ')"
    fi
    npm run fetch-chp-reciprocity >> "$LOG" 2>&1
    npm run fetch-chp-sheriffs >> "$LOG" 2>&1
    ;;
  districts)
    npm run fetch-districts >> "$LOG" 2>&1
    RC=$?
    if [ "$RC" -eq 3 ]; then
      notify "NEW REDISTRICTING PLAN DETECTED — the official shapefile link changed. A human must verify the plan and update scripts/districts/sources.ts, then re-run: bash scripts/freshness-loop.sh districts. Nothing committed."
      exit 0
    fi
    ;;
  committees)
    # exit 1 with files written = photos missing (page degrades to
    # placeholders; self-heals next run via photo-flag diff) → still commit.
    # exit 1 with a clean tree = missing fields → nothing to do.
    npm run fetch-committees >> "$LOG" 2>&1
    ;;
esac

# --- commit any content changes (validators gate every commit) ---------------
CHANGED=$(git status --porcelain $DATA_PATHS)
if [ -z "$CHANGED" ]; then
  log "no content changes — nothing committed (clean no-op run; check recorded)"
  exit 0
fi

VRC=0
case "$SOURCE" in
  chp)
    npm run validate-chp-reciprocity >> "$LOG" 2>&1 || VRC=1
    npm run validate-chp-sheriffs >> "$LOG" 2>&1 || VRC=1
    ;;
  districts)  npm run validate-districts  >> "$LOG" 2>&1 || VRC=1 ;;
  committees) npm run validate-committees >> "$LOG" 2>&1 || VRC=1 ;;
esac

if [ "$VRC" -ne 0 ]; then
  # Discard the fetched change (tracked + the loop's own new untracked files)
  # — the tree must end clean (next tick re-detects from committed state).
  git restore --source=HEAD --staged --worktree -- $DATA_PATHS
  git status --porcelain $DATA_PATHS | awk '$1 == "??" {print $2}' | xargs -r rm -f
  log "validators FAILED — fetched change discarded, tree restored, nothing committed"
  notify "validators FAILED on freshly fetched $SOURCE data — the change was discarded (tree restored to the last commit). Human review needed. Log tail: $(tail -n 2 "$LOG" | tr '\n' ' ')"
  exit 1
fi

case "$SOURCE" in
  chp)        DESC="concealed-carry data" ;;
  districts)  DESC="district map data" ;;
  committees) DESC="committee rosters" ;;
esac
git add $DATA_PATHS
git commit -q -m "data($SOURCE): refresh $DESC (freshness loop)" >> "$LOG" 2>&1 \
  || { notify "commit failed unexpectedly — see .cache/freshness-loop.log"; exit 1; }

if git push origin main >> "$LOG" 2>&1; then
  notify "refreshed + committed + pushed: $(git log --oneline -1 | head -c 90)"
  log "committed + pushed $(git rev-parse --short main)"
else
  notify "committed locally ($(git rev-parse --short main)) but PUSH FAILED — push manually (git push). The site already shows the new data (pages read the disk); history is complete once pushed."
  exit 1
fi
log "done"

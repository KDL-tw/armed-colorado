#!/usr/bin/env bash
# armed-colorado auto-pull — the local half of the data-freshness automation.
#
# The CHP + district data-refresh jobs run in GitHub Actions, arm auto-merge
# (squash), and land on origin/main when CI is green. This script keeps the
# local working tree — the one the site serves from — in sync:
#
#   - skips cleanly when the working tree is dirty (you are mid-work) and
#     retries on the next tick
#   - fast-forwards main when local has no unpushed commits
#   - logs every tick to .cache/auto-pull.log (gitignored)
#   - never creates merge commits, never touches local unpushed commits,
#     never force-pushes, never pulls over a dirty tree
#
# The data pages render per request and read the data files from disk, so a
# pulled data change is live on the next page load — no rebuild, no restart.
# (Code changes still need your own build/commit workflow.)
#
# Divergence (unpushed local commits + advanced remote) is logged and left
# for you: push locally, then the next tick fast-forwards. A stale
# "Last updated" note on the site is the visible tell.
#
# Cron:  */15 * * * *  /home/noether/renhorne/armed-colorado/scripts/auto-pull.sh
#
# Run manually any time:  bash scripts/auto-pull.sh
set -uo pipefail

REPO=/home/noether/renhorne/armed-colorado
LOG="$REPO/.cache/auto-pull.log"
mkdir -p "$(dirname "$LOG")"

log() { echo "[$(date -Is)] $*" | tee -a "$LOG"; }

cd "$REPO" || { log "FAIL: cannot cd to $REPO"; exit 1; }

if [ -n "$(git status --porcelain)" ]; then
  log "SKIP: working tree dirty (local work in progress) — retry next tick"
  exit 0
fi

if ! git fetch origin main 2>>"$LOG"; then
  log "FAIL: git fetch origin main failed (network or SSH auth?)"
  exit 1
fi

LOCAL=$(git rev-parse main)
REMOTE=$(git rev-parse origin/main)
if [ "$LOCAL" = "$REMOTE" ]; then
  log "OK: already up to date (${LOCAL:0:8})"
  exit 0
fi

if git merge-base --is-ancestor "$LOCAL" "$REMOTE"; then
  if git merge --ff-only origin/main >>"$LOG" 2>&1; then
    log "PULLED: ${LOCAL:0:8} -> $(git rev-parse main | cut -c1-8) — data live on next page load (no rebuild needed)"
  else
    log "FAIL: ff-only merge failed — inspect $REPO manually"
    exit 1
  fi
else
  log "DIVERGED: local main has unpushed commits AND origin/main advanced. Push locally (cd $REPO && git push), then the next tick fast-forwards."
  exit 0
fi

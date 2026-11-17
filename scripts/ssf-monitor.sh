#!/usr/bin/env bash
# Cheap daily change-detector for the FDD "Specified Semiautomatic Firearms
# Guidance" list. Runs each cron tick WITHOUT an LLM: fetches the FDD page and
# prints the newest guidance version (date embedded in the PDF filename) as a
# single stable line. The cron `monitor` compares this to the previous tick;
# when FDD publishes a newer version the line changes and the updater agent is
# woken. Output is deterministic (no timestamps) — required by the monitor.
set -uo pipefail
UA="Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36"
html="$(curl -sSL --retry 2 --max-time 30 -A "$UA" 'https://sbg.colorado.gov/firearms-dealer-division' 2>/dev/null)" || {
  echo "ssf-guidance-version=fdd-page-unreachable"
  exit 0
}
ver="$(printf '%s\n' "$html" \
  | grep -oiE 'Specified_Semiautomatic_Firearms_Guidance_[0-9]{1,2}\.[0-9]{1,2}\.[0-9]{4}\.pdf' \
  | grep -oE '[0-9]{1,2}\.[0-9]{1,2}\.[0-9]{4}' \
  | awk -F. '{ printf "%04d-%02d-%02d\n", $3, $1, $2 }' \
  | sort -u \
  | tail -n 1)"
if [ -n "$ver" ]; then
  echo "ssf-guidance-version=$ver"
else
  echo "ssf-guidance-version=none-found"
fi

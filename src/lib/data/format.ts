/**
 * Pure display helpers for data-freshness stamps. No I/O — safe to import from
 * server components and (if ever needed) the client bundle.
 */

/**
 * Format an ISO-8601 timestamp as a human-readable date + time in Mountain
 * time (America/Denver), e.g. "Nov 30, 2026, 04:28 MDT". Military time
 * (24-hour, no AM/PM — user preference): hourCycle "h23" so midnight is
 * "00:00", not "24:00". Returns "—" for a missing or invalid value so the
 * UI degrades to a visible placeholder rather than "Invalid Date".
 */
export function formatStamp(iso: string | null | undefined): string {
  if (typeof iso !== "string" || iso.length === 0) return "—";
  const parsed = Date.parse(iso);
  if (Number.isNaN(parsed)) return "—";
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Denver",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZoneName: "short",
  }).format(new Date(parsed));
}

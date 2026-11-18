import { formatStamp } from "@/lib/data/format";

/**
 * A two-line, light-grey freshness note rendered immediately under a block of
 * pulled data: when the job last checked the data, and when the data last
 * changed.
 *
 * Server component (no client state) — render it directly under the data it
 * describes.
 *
 * The lines are <div>s, not <p>s: guide layouts wrap their content in
 * `.prose-guide`, whose global rule `.prose-guide p { color: var(--muted) }`
 * would otherwise force the (darker) muted colour on any <p> and override the
 * inherited light-grey from the container. <div>s sidestep that rule so the
 * note stays light-grey on every page.
 */
export function DataStamp({
  checkedAt,
  updatedAt,
  className = "",
}: {
  checkedAt: string;
  updatedAt: string;
  className?: string;
}) {
  return (
    <div
      className={`text-xs leading-relaxed text-silver-muted ${className}`.trim()}
    >
      <div>Last checked: {formatStamp(checkedAt)}</div>
      <div>Last updated: {formatStamp(updatedAt)}</div>
    </div>
  );
}

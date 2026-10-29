/**
 * Pure geometry helpers for the district pipeline. No dependencies.
 * All coordinates are WGS84 [lon, lat].
 */
// NOTE: scripts use RELATIVE imports (repo convention — see scripts/assemble-catalog.ts);
// the "@/" alias is only guaranteed inside src/.
import type { LonLat } from "../../src/lib/districts/types";

/**
 * Ramer-Douglas-Peucker simplification of a ring.
 * `tolerance` is in degrees (~0.002 ≈ 200 m at Colorado latitudes).
 * The ring is closed (first point === last point); the result stays closed.
 */
export function simplifyRing(ring: LonLat[], tolerance: number): LonLat[] {
  if (ring.length < 4) return ring;
  // Closed ring: run DP on the open arc, keep the closing point.
  const open = ring.slice(0, -1);
  const keep = new Array<boolean>(open.length).fill(false);
  keep[0] = true;
  keep[open.length - 1] = true;
  const stack: [number, number][] = [[0, open.length - 1]];
  while (stack.length) {
    const [s, e] = stack.pop()!;
    let maxDist = -1;
    let idx = -1;
    for (let i = s + 1; i < e; i++) {
      const d = perpDist(open[i], open[s], open[e]);
      if (d > maxDist) {
        maxDist = d;
        idx = i;
      }
    }
    if (maxDist > tolerance && idx !== -1) {
      keep[idx] = true;
      stack.push([s, idx], [idx, e]);
    }
  }
  const kept = open.filter((_, i) => keep[i]);
  kept.push(kept[0]);
  return kept;
}

function perpDist(p: LonLat, a: LonLat, b: LonLat): number {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) return Math.hypot(p[0] - a[0], p[1] - a[1]);
  const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / len2));
  return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy));
}

/**
 * Simplify every ring of every polygon of a feature, then clean up:
 *  - drop rings that collapsed to < 4 points (degenerate slivers from the
 *    source data — sub-meter artifacts that render as nothing), and
 *  - drop polygons that lost all their rings.
 */
export function simplifyRings(rings: LonLat[][][], tolerance: number): LonLat[][][] {
  return rings
    .map((polygon) => polygon.map((ring) => simplifyRing(ring, tolerance)))
    .map((polygon) => polygon.filter((ring) => ring.length >= 4))
    .filter((polygon) => polygon.length > 0);
}

/** Centroid of a ring (mean of its points — fine for label placement). */
export function ringCentroid(ring: LonLat[]): LonLat {
  let x = 0;
  let y = 0;
  const n = ring.length - 1; // exclude closing duplicate
  for (let i = 0; i < n; i++) {
    x += ring[i][0];
    y += ring[i][1];
  }
  return [x / n, y / n];
}

/** Label point for a feature: centroid of its largest ring. */
export function labelPoint(rings: LonLat[][][]): LonLat {
  if (rings.length === 0) throw new Error("labelPoint: feature has no polygons after cleanup");
  let biggest = rings[0][0];
  for (const polygon of rings) {
    if (polygon[0].length > biggest.length) biggest = polygon[0];
  }
  return ringCentroid(biggest);
}

const round4 = (n: number) => Math.round(n * 10000) / 10000;

/** Round a single point to 4 decimals (~11 m). */
export function roundPoint(p: LonLat): LonLat {
  return [round4(p[0]), round4(p[1])];
}

/** Round coordinates to 4 decimals (~11 m) to keep the data file small. */
export function roundRings(rings: LonLat[][][]): LonLat[][][] {
  return rings.map((polygon) =>
    polygon.map((ring) => ring.map(([lon, lat]) => [round4(lon), round4(lat)] as LonLat)),
  );
}

/**
 * Project [lon, lat] into SVG space. Equirectangular with a cos(39°)
 * longitude correction (Colorado's mid-latitude). K scales degrees -> units.
 */
export function makeProjector(minLon: number, maxLat: number, k: number) {
  const COS39 = Math.cos((39 * Math.PI) / 180);
  return (lon: number, lat: number): [number, number] => [
    (lon - minLon) * COS39 * k,
    (maxLat - lat) * k,
  ];
}

/** Convert one ring to an SVG path `d` (rounded to 3 decimals for size). */
export function ringToPath(ring: LonLat[], project: (lon: number, lat: number) => [number, number]): string {
  const pts = ring.map(([lon, lat]) => {
    const [x, y] = project(lon, lat);
    return `${x.toFixed(3)},${y.toFixed(3)}`;
  });
  return `M${pts.join("L")}Z`;
}

/** Full feature path: outer rings + holes (nonzero fill handles holes). */
export function ringsToPath(rings: LonLat[][][], project: (lon: number, lat: number) => [number, number]): string {
  return rings.map((polygon) => polygon.map((ring) => ringToPath(ring, project)).join("")).join("");
}

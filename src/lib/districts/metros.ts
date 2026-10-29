import type { ChamberData, CountyFeature, LonLat } from "./types";

/**
 * Shared district-map geometry: projection helpers, per-district coloring,
 * and the metro-inset builder. Used by both the inline insets on the
 * /legislators page (small, linked) and the full-page metro maps at
 * /legislators/districts/[chamber]/[metro] (large, interactive).
 *
 * Isomorphic on purpose — no node:fs / process.cwd() — so it can be imported
 * from server components and client components alike.
 */

/** Equirectangular longitude correction at Colorado's mid-latitude (39°). */
export const COS39 = Math.cos((39 * Math.PI) / 180);

/**
 * Deterministic, readable per-district color: golden-angle hue rotation so
 * adjacent districts differ, stable across renders (no randomness).
 */
export function districtColor(n: number): string {
  return `hsl(${Math.round((n * 137.508) % 360)}, 52%, 74%)`;
}

/**
 * Build an SVG path `d` for a feature's rings under a projector.
 * Outer rings + holes; the nonzero fill rule handles holes.
 */
export function ringsToPath(
  rings: LonLat[][][],
  project: (lon: number, lat: number) => [number, number],
): string {
  return rings
    .map((poly) =>
      poly
        .map((ring) => {
          const pts = ring
            .map(([lon, lat]) => {
              const [x, y] = project(lon, lat);
              return `${x.toFixed(3)},${y.toFixed(3)}`;
            })
            .join("L");
          return `M${pts}Z`;
        })
        .join(""),
    )
    .join("");
}

function shoelaceArea(ring: LonLat[]): number {
  let a = 0;
  for (let i = 0; i < ring.length; i++) {
    const [x1, y1] = ring[i];
    const [x2, y2] = ring[(i + 1) % ring.length];
    a += x1 * y2 - x2 * y1;
  }
  return Math.abs(a) / 2;
}

function vertexCentroid(ring: LonLat[]): [number, number] {
  let sx = 0;
  let sy = 0;
  for (const [x, y] of ring) {
    sx += x;
    sy += y;
  }
  return [sx / ring.length, sy / ring.length];
}

function bboxCenter(ring: LonLat[]): [number, number] {
  let minLon = Infinity,
    maxLon = -Infinity,
    minLat = Infinity,
    maxLat = -Infinity;
  for (const [lon, lat] of ring) {
    if (lon < minLon) minLon = lon;
    if (lon > maxLon) maxLon = lon;
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
  }
  return [(minLon + maxLon) / 2, (minLat + maxLat) / 2];
}

function pointInRing(pt: LonLat, ring: LonLat[]): boolean {
  const [x, y] = pt;
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

function isInsideCounty(pt: LonLat, county: CountyFeature): boolean {
  for (const poly of county.rings) {
    if (pointInRing(pt, poly[0])) {
      const inHole = poly.slice(1).some((hole) => pointInRing(pt, hole));
      if (!inHole) return true;
    }
  }
  return false;
}

/** Pick a label position inside a county's largest ring (fallback: bbox center). */
export function countyLabelPos(county: CountyFeature): [number, number] {
  let best: LonLat[] = county.rings[0][0];
  let bestArea = -1;
  for (const poly of county.rings) {
    for (const ring of poly) {
      const a = shoelaceArea(ring);
      if (a > bestArea) {
        bestArea = a;
        best = ring;
      }
    }
  }
  const vc = vertexCentroid(best);
  return isInsideCounty(vc, county) ? vc : bboxCenter(best);
}

export interface BBox {
  minLon: number;
  maxLon: number;
  minLat: number;
  maxLat: number;
}

/** Mutate `box` to encompass every vertex in `rings`. */
export function scanBBox(rings: LonLat[][][], box: BBox): void {
  for (const poly of rings)
    for (const ring of poly)
      for (const [lon, lat] of ring) {
        if (lon < box.minLon) box.minLon = lon;
        if (lon > box.maxLon) box.maxLon = lon;
        if (lat < box.minLat) box.minLat = lat;
        if (lat > box.maxLat) box.maxLat = lat;
      }
}

export interface MetroDef {
  key: string;
  title: string;
  /** County names (as stored in the data) that make up this metro. */
  names: string[];
}

/** The two metro insets shown on the /legislators page. */
export const METRO_DEFS: MetroDef[] = [
  {
    key: "denver",
    title: "Denver Metro",
    names: [
      "ADAMS",
      "ARAPAHOE",
      "BOULDER",
      "BROOMFIELD",
      "CLEAR CREEK",
      "DENVER",
      "DOUGLAS",
      "GILPIN",
      "JEFFERSON",
    ],
  },
  {
    key: "springs",
    title: "Colorado Springs Metro",
    names: ["EL PASO", "TELLER"],
  },
];

export interface MetroInsetGeometry {
  key: string;
  title: string;
  W: number;
  H: number;
  /** County outline paths (also used as the clip). */
  clipCounties: string[];
  countyLabels: { name: string; label: [number, number] }[];
  /** Districts whose label point falls inside the metro bbox. */
  districtPaths: { district: number; d: string; label: [number, number] }[];
}

/**
 * Project one metro's counties + districts into a W×H box (aspect preserved,
 * centered), clipped to the union of the metro's county shapes.
 *
 * Throws loudly when a county name from the def is missing from the data,
 * rather than rendering a silently-incomplete inset.
 */
export function buildMetroInset(
  counties: CountyFeature[],
  data: ChamberData,
  metro: MetroDef,
  W: number,
  H: number,
): MetroInsetGeometry {
  const metroCounties = counties.filter((c) => metro.names.includes(c.name));
  if (metroCounties.length !== metro.names.length) {
    throw new Error(
      `Metro "${metro.title}": found ${metroCounties.length}/${metro.names.length} counties`,
    );
  }
  const box: BBox = {
    minLon: Infinity,
    maxLon: -Infinity,
    minLat: Infinity,
    maxLat: -Infinity,
  };
  for (const c of metroCounties) scanBBox(c.rings, box);
  const kx = W / ((box.maxLon - box.minLon) * COS39);
  const ky = H / (box.maxLat - box.minLat);
  const k = Math.min(kx, ky);
  const ox = (W - (box.maxLon - box.minLon) * COS39 * k) / 2;
  const oy = (H - (box.maxLat - box.minLat) * k) / 2;
  const ip = (lon: number, lat: number): [number, number] => [
    ox + (lon - box.minLon) * COS39 * k,
    oy + (box.maxLat - lat) * k,
  ];
  const inBox = (p: LonLat) =>
    p[0] >= box.minLon &&
    p[0] <= box.maxLon &&
    p[1] >= box.minLat &&
    p[1] <= box.maxLat;
  return {
    key: metro.key,
    title: metro.title,
    W,
    H,
    clipCounties: metroCounties.map((c) => ringsToPath(c.rings, ip)),
    countyLabels: metroCounties.map((c) => {
      const [lon, lat] = countyLabelPos(c);
      return { name: c.name, label: ip(lon, lat) };
    }),
    districtPaths: data.districts
      .filter((d) => inBox(d.label))
      .map((d) => ({
        district: d.district,
        d: ringsToPath(d.rings, ip),
        label: ip(d.label[0], d.label[1]),
      })),
  };
}

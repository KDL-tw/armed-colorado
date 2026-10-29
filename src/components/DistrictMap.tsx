"use client";

import { useMemo, useState } from "react";
import type {
  ChamberData,
  CountyFeature,
  LonLat,
} from "@/lib/districts/types";

interface DistrictMapProps {
  chamber: "house" | "senate";
  data: ChamberData;
  counties: CountyFeature[];
  planYear: number;
  effectiveSince: string;
}

/** Equirectangular longitude correction at Colorado's mid-latitude (39°). */
const COS39 = Math.cos((39 * Math.PI) / 180);

/**
 * Deterministic, readable per-district color: golden-angle hue rotation so
 * adjacent districts differ, stable across renders (no randomness).
 */
function districtColor(n: number): string {
  return `hsl(${Math.round((n * 137.508) % 360)}, 52%, 74%)`;
}

/**
 * Build an SVG path `d` for a feature's rings under a projector.
 * Outer rings + holes; the nonzero fill rule handles holes.
 */
function ringsToPath(
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
  for (const [x, y] of ring) { sx += x; sy += y; }
  return [sx / ring.length, sy / ring.length];
}

function bboxCenter(ring: LonLat[]): [number, number] {
  let minLon = Infinity, maxLon = -Infinity, minLat = Infinity, maxLat = -Infinity;
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

function countyLabelPos(county: CountyFeature): [number, number] {
  let best: LonLat[] = county.rings[0][0];
  let bestArea = -1;
  for (const poly of county.rings) {
    for (const ring of poly) {
      const a = shoelaceArea(ring);
      if (a > bestArea) { bestArea = a; best = ring; }
    }
  }
  const vc = vertexCentroid(best);
  return isInsideCounty(vc, county) ? vc : bboxCenter(best);
}

interface BBox {
  minLon: number;
  maxLon: number;
  minLat: number;
  maxLat: number;
}

function scanBBox(rings: LonLat[][][], box: BBox): void {
  for (const poly of rings)
    for (const ring of poly)
      for (const [lon, lat] of ring) {
        if (lon < box.minLon) box.minLon = lon;
        if (lon > box.maxLon) box.maxLon = lon;
        if (lat < box.minLat) box.minLat = lat;
        if (lat > box.maxLat) box.maxLat = lat;
      }
}

export default function DistrictMap({
  chamber,
  data,
  counties,
  planYear,
  effectiveSince,
}: DistrictMapProps) {
  const [hover, setHover] = useState<number | null>(null);
  const label = chamber === "house" ? "House" : "Senate";

  // Main-map projection: fit all districts + counties into a 1000-unit-wide box.
  const main = useMemo(() => {
    const box: BBox = { minLon: Infinity, maxLon: -Infinity, minLat: Infinity, maxLat: -Infinity };
    for (const d of data.districts) scanBBox(d.rings, box);
    for (const c of counties) scanBBox(c.rings, box);
    const k = 1000 / ((box.maxLon - box.minLon) * COS39);
    const project = (lon: number, lat: number): [number, number] => [
      (lon - box.minLon) * COS39 * k,
      (box.maxLat - lat) * k,
    ];
    return {
      width: (box.maxLon - box.minLon) * COS39 * k,
      height: (box.maxLat - box.minLat) * k,
      project,
      countyPaths: counties.map((c) => ({ name: c.name, d: ringsToPath(c.rings, project) })),
      countyLabels: counties.map((c) => {
        const [lon, lat] = countyLabelPos(c);
        return { name: c.name, label: project(lon, lat) };
      }),
      districtPaths: data.districts.map((d) => ({
        district: d.district,
        d: ringsToPath(d.rings, project),
        label: project(d.label[0], d.label[1]),
      })),
    };
  }, [data, counties]);

  // Metro insets: each re-projects its counties + the districts whose label
  // falls in the metro bbox, clipped to the union of the metro's county shapes.
  const metros = useMemo(() => {
    const defs = [
      {
        key: "denver",
        title: "Denver Metro",
        names: [
          "ADAMS", "ARAPAHOE", "BOULDER", "BROOMFIELD", "CLEAR CREEK",
          "DENVER", "DOUGLAS", "GILPIN", "JEFFERSON",
        ],
      },
      { key: "springs", title: "Colorado Springs Metro", names: ["EL PASO", "TELLER"] },
    ];
    const W = 320;
    const H = 280;
    return defs.map((m) => {
      const metroCounties = counties.filter((c) => m.names.includes(c.name));
      if (metroCounties.length !== m.names.length) {
        // A county name from the service didn't match — surface it loudly
        // rather than rendering a silently-incomplete inset.
        throw new Error(
          `Metro "${m.title}": found ${metroCounties.length}/${m.names.length} counties`,
        );
      }
      const box: BBox = { minLon: Infinity, maxLon: -Infinity, minLat: Infinity, maxLat: -Infinity };
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
        p[0] >= box.minLon && p[0] <= box.maxLon && p[1] >= box.minLat && p[1] <= box.maxLat;
      return {
        key: m.key,
        title: m.title,
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
    });
  }, [counties, data]);

  return (
    <figure>
      <figcaption aria-live="polite" className="mb-2 text-sm font-medium text-navy">
        {hover !== null ? (
          <span className="text-oxblood">{label} District {hover}</span>
        ) : (
          <span className="text-muted">Hover or tap a district to see its number</span>
        )}
      </figcaption>

      <svg
        viewBox={`0 0 ${main.width.toFixed(1)} ${main.height.toFixed(1)}`}
        className="h-auto w-full"
        role="img"
        aria-label={`Map of Colorado ${label} districts, ${planYear} plan`}
      >
        {/* County underlay: delimiters show through the district fills. */}
        <g>
          {main.countyPaths.map((c) => (
            <path
              key={c.name}
              d={c.d}
              fill="#e8eaee"
              stroke="#64748b"
              strokeWidth={0.9}
              vectorEffect="non-scaling-stroke"
            />
          ))}
          {main.countyLabels.map((c) => (
            <text
              key={c.name}
              x={c.label[0].toFixed(1)}
              y={c.label[1].toFixed(1)}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={7}
              fontWeight={500}
              fill="#1e293b"
              stroke="#ffffff"
              strokeWidth={2}
              paintOrder="stroke"
              style={{ pointerEvents: "none" }}
            >
              {c.name}
            </text>
          ))}
        </g>
        {/* Districts. */}
        <g>
          {main.districtPaths.map((d) => {
            const active = hover === d.district;
            return (
              <g key={d.district}>
                <path
                  d={d.d}
                  fill={districtColor(d.district)}
                  fillOpacity={active ? 1 : 0.55}
                  stroke={active ? "#0a1a33" : "#ffffff"}
                  strokeWidth={active ? 1.6 : 0.7}
                  vectorEffect="non-scaling-stroke"
                  className="cursor-pointer transition-[fill-opacity] duration-150"
                  onMouseEnter={() => setHover(d.district)}
                  onMouseLeave={() => setHover(null)}
                />
                <text
                  x={d.label[0].toFixed(1)}
                  y={d.label[1].toFixed(1)}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={11}
                  fontWeight={600}
                  fill="#0a1a33"
                  stroke="#faf9f6"
                  strokeWidth={2.5}
                  paintOrder="stroke"
                  vectorEffect="non-scaling-stroke"
                  style={{ pointerEvents: "none" }}
                >
                  {d.district}
                </text>
              </g>
            );
          })}
        </g>
      </svg>

      {/* Metro insets. */}
      <div className="mt-4 flex flex-wrap gap-6">
        {metros.map((m) => (
          <figure key={m.key} className="w-64">
            <svg
              viewBox={`0 0 ${m.W} ${m.H}`}
              className="h-auto w-full"
              role="img"
              aria-label={`${m.title} inset`}
            >
              <defs>
                <clipPath id={`clip-${chamber}-${m.key}`}>
                  {m.clipCounties.map((d, i) => (
                    <path key={i} d={d} />
                  ))}
                </clipPath>
              </defs>
              <g clipPath={`url(#clip-${chamber}-${m.key})`}>
                {m.clipCounties.map((d, i) => (
                  <path
                    key={i}
                    d={d}
                    fill="#e8eaee"
                    stroke="#64748b"
                    strokeWidth={0.8}
                    vectorEffect="non-scaling-stroke"
                  />
                ))}
                {m.countyLabels.map((c) => (
                  <text
                    key={c.name}
                    x={c.label[0].toFixed(1)}
                    y={c.label[1].toFixed(1)}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize={9}
                    fontWeight={500}
                    fill="#1e293b"
                    stroke="#ffffff"
                    strokeWidth={1.5}
                    paintOrder="stroke"
                    style={{ pointerEvents: "none" }}
                  >
                    {c.name}
                  </text>
                ))}
                {m.districtPaths.map((d) => (
                  <path
                    key={d.district}
                    d={d.d}
                    fill={districtColor(d.district)}
                    fillOpacity={0.65}
                    stroke="#ffffff"
                    strokeWidth={0.5}
                    vectorEffect="non-scaling-stroke"
                  />
                ))}
              </g>
              {/* Inset labels are NOT clipped so a district whose body is mostly
                  outside the metro but whose label is inside still shows its number. */}
              {m.districtPaths.map((d) => (
                <text
                  key={d.district}
                  x={d.label[0].toFixed(1)}
                  y={d.label[1].toFixed(1)}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={10}
                  fontWeight={600}
                  fill="#0a1a33"
                  stroke="#faf9f6"
                  strokeWidth={2}
                  paintOrder="stroke"
                  style={{ pointerEvents: "none" }}
                >
                  {d.district}
                </text>
              ))}
              <rect
                x={0.5}
                y={0.5}
                width={m.W - 1}
                height={m.H - 1}
                fill="none"
                stroke="#6b1520"
                strokeWidth={1}
                strokeDasharray="4 3"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
            <figcaption className="mt-1 text-center text-xs font-medium uppercase tracking-wide text-muted">
              {m.title}
            </figcaption>
          </figure>
        ))}
      </div>

      <figcaption className="mt-3 text-sm text-muted">
        {label} districts, {planYear} plan (in effect since {effectiveSince}). Source:{" "}
        <a
          href={data.interactiveMapUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-oxblood hover:underline"
        >
          official interactive map
        </a>{" "}
        ·{" "}
        <a
          href="https://redistricting.colorado.gov/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-oxblood hover:underline"
        >
          redistricting.colorado.gov
        </a>
      </figcaption>
    </figure>
  );
}

"use client";

import { useMemo, useState } from "react";
import type { ChamberData, CountyFeature } from "@/lib/districts/types";
import {
  COS39,
  METRO_DEFS,
  buildMetroInset,
  countyLabelPos,
  districtColor,
  ringsToPath,
  scanBBox,
  type BBox,
} from "@/lib/districts/metros";

interface DistrictMapProps {
  chamber: "house" | "senate";
  data: ChamberData;
  counties: CountyFeature[];
  planYear: number;
  effectiveSince: string;
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
    const box: BBox = {
      minLon: Infinity,
      maxLon: -Infinity,
      minLat: Infinity,
      maxLat: -Infinity,
    };
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
  // Shared geometry with the full-page maps (see src/lib/districts/metros.ts).
  const metros = useMemo(
    () => METRO_DEFS.map((m) => buildMetroInset(counties, data, m, 320, 280)),
    [counties, data],
  );

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

      {/* Metro insets — clickable: each opens the full-page interactive map
          for that metro in a new tab (the inline insets are too zoomed out). */}
      <div className="mt-4 flex flex-wrap gap-6">
        {metros.map((m) => (
          <a
            key={m.key}
            href={`/legislators/districts/${chamber}/${m.key}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Open ${m.title} ${label} district map in a new tab`}
            className="group w-64 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-oxblood"
          >
            <svg
              viewBox={`0 0 ${m.W} ${m.H}`}
              className="h-auto w-full rounded-sm ring-1 ring-transparent transition duration-150 group-hover:ring-oxblood/60"
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
            <span className="mt-1 block text-center text-xs font-medium uppercase tracking-wide text-muted transition group-hover:text-oxblood">
              {m.title} · click to enlarge
            </span>
          </a>
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

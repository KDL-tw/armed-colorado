"use client";

import { useMemo, useState } from "react";
import type { ChamberData, CountyFeature } from "@/lib/districts/types";
import {
  METRO_DEFS,
  buildMetroInset,
  districtColor,
} from "@/lib/districts/metros";

interface MetroMapProps {
  chamber: "house" | "senate";
  data: ChamberData;
  counties: CountyFeature[];
  metroKey: string;
  planYear: number;
  effectiveSince: string;
}

/** Full-page size for the enlarged metro map (the inline insets use 320×280). */
const W = 900;
const H = 700;

/**
 * A single metro's district map at full size, with the same hover interactivity
 * as the main state map on /legislators (hover/tap a district to see its number).
 * Geometry is shared with the inline insets via buildMetroInset.
 */
export default function MetroMap({
  chamber,
  data,
  counties,
  metroKey,
  planYear,
  effectiveSince,
}: MetroMapProps) {
  const [hover, setHover] = useState<number | null>(null);
  const label = chamber === "house" ? "House" : "Senate";
  const def = METRO_DEFS.find((m) => m.key === metroKey);
  const title = def?.title ?? `${metroKey} Metro`;

  const inset = useMemo(() => {
    if (!def) return null;
    return buildMetroInset(counties, data, def, W, H);
  }, [counties, data, def]);

  if (!inset) return null;

  return (
    <figure>
      <figcaption aria-live="polite" className="mb-2 text-sm font-medium text-navy">
        {hover !== null ? (
          <span className="text-oxblood">{label} District {hover}</span>
        ) : (
          <span className="text-muted">
            {title} — hover or tap a district to see its number
          </span>
        )}
      </figcaption>

      <svg
        viewBox={`0 0 ${inset.W} ${inset.H}`}
        className="h-auto w-full"
        role="img"
        aria-label={`${title} ${label} district map, ${planYear} plan`}
      >
        <defs>
          <clipPath id={`clip-full-${chamber}-${inset.key}`}>
            {inset.clipCounties.map((d, i) => (
              <path key={i} d={d} />
            ))}
          </clipPath>
        </defs>
        <g clipPath={`url(#clip-full-${chamber}-${inset.key})`}>
          {inset.clipCounties.map((d, i) => (
            <path
              key={i}
              d={d}
              fill="#e8eaee"
              stroke="#64748b"
              strokeWidth={0.8}
              vectorEffect="non-scaling-stroke"
            />
          ))}
          {inset.countyLabels.map((c) => (
            <text
              key={c.name}
              x={c.label[0].toFixed(1)}
              y={c.label[1].toFixed(1)}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={14}
              fontWeight={500}
              fill="#1e293b"
              stroke="#ffffff"
              strokeWidth={2.5}
              paintOrder="stroke"
              style={{ pointerEvents: "none" }}
            >
              {c.name}
            </text>
          ))}
          {inset.districtPaths.map((d) => {
            const active = hover === d.district;
            return (
              <path
                key={d.district}
                d={d.d}
                fill={districtColor(d.district)}
                fillOpacity={active ? 1 : 0.65}
                stroke={active ? "#0a1a33" : "#ffffff"}
                strokeWidth={active ? 2 : 0.6}
                vectorEffect="non-scaling-stroke"
                className="cursor-pointer transition-[fill-opacity] duration-150"
                onMouseEnter={() => setHover(d.district)}
                onMouseLeave={() => setHover(null)}
              />
            );
          })}
        </g>
        {/* District numbers are NOT clipped so a district whose body is mostly
            outside the metro but whose label is inside still shows its number. */}
        {inset.districtPaths.map((d) => (
          <text
            key={d.district}
            x={d.label[0].toFixed(1)}
            y={d.label[1].toFixed(1)}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={18}
            fontWeight={600}
            fill="#0a1a33"
            stroke="#faf9f6"
            strokeWidth={3}
            paintOrder="stroke"
            vectorEffect="non-scaling-stroke"
            style={{ pointerEvents: "none" }}
          >
            {d.district}
          </text>
        ))}
      </svg>

      <figcaption className="mt-3 text-sm text-muted">
        {title}, {label} districts, {planYear} plan (in effect since {effectiveSince}).
        Source:{" "}
        <a
          href={data.interactiveMapUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-oxblood hover:underline"
        >
          official interactive map
        </a>
      </figcaption>
    </figure>
  );
}

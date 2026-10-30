"use client";

import { useMemo, useState } from "react";
import type { CountyFeature } from "@/lib/districts/types";
import { COS39, countyLabelPos, ringsToPath, scanBBox, type BBox } from "@/lib/districts/metros";
import type { SheriffInfo } from "@/lib/chp/types";

/**
 * Interactive map of Colorado's 64 counties. `counties` is the committed
 * geometry from data/districts/districts.json; `sheriffs` is the
 * data/chp/sheriffs.json catalog (joined on UPPERCASE county name).
 * Hover a county for sheriff info; click to open the county's CHP page.
 */
export function ColoradoSheriffsMap({
  counties,
  sheriffs,
}: {
  counties: CountyFeature[];
  sheriffs: SheriffInfo[];
}) {
  const [hover, setHover] = useState<string | null>(null);

  const main = useMemo(() => {
    const box: BBox = { minLon: Infinity, maxLon: -Infinity, minLat: Infinity, maxLat: -Infinity };
    for (const c of counties) scanBBox(c.rings, box);
    const k = 1000 / ((box.maxLon - box.minLon) * COS39);
    const project = (lon: number, lat: number): [number, number] => [
      (lon - box.minLon) * COS39 * k,
      (box.maxLat - lat) * k,
    ];
    const byCounty = new Map(sheriffs.map((s) => [s.county, s]));
    return {
      width: (box.maxLon - box.minLon) * COS39 * k,
      height: (box.maxLat - box.minLat) * k,
      counties: counties.map((c) => ({
        name: c.name,
        d: ringsToPath(c.rings, project),
        label: project(...countyLabelPos(c)),
        sheriff: byCounty.get(c.name),
      })),
    };
  }, [counties, sheriffs]);

  const hovered = hover ? main.counties.find((c) => c.name === hover) : null;
  const hrefFor = (s: SheriffInfo | undefined): string | null => s?.chpUrl ?? s?.website ?? null;

  return (
    <figure>
      <figcaption aria-live="polite" className="mb-2 text-sm font-medium text-navy">
        {hovered?.sheriff ? (
          <span className="text-oxblood">{hovered.name} County Sheriff’s Office</span>
        ) : (
          <span className="text-muted">Hover a county for its sheriff’s office; click to open its CHP page</span>
        )}
      </figcaption>
      <svg viewBox={`0 0 ${main.width.toFixed(1)} ${main.height.toFixed(1)}`} className="h-auto w-full" role="img" aria-label="Map of Colorado counties and their sheriff's offices">
        {main.counties.map((c) => {
          const active = hover === c.name;
          const href = hrefFor(c.sheriff);
          return (
            <g key={c.name}>
              {href ? (
                <a href={href} target="_blank" rel="noopener noreferrer" aria-label={`Open ${c.name} County CHP page`}>
                  <path
                    d={c.d}
                    fill={active ? "#6b1520" : "#e8eaee"}
                    fillOpacity={active ? 0.9 : 1}
                    stroke={active ? "#0a1a33" : "#64748b"}
                    strokeWidth={active ? 1.6 : 0.9}
                    vectorEffect="non-scaling-stroke"
                    className="cursor-pointer transition-[fill] duration-150"
                    onMouseEnter={() => setHover(c.name)}
                    onMouseLeave={() => setHover(null)}
                  />
                </a>
              ) : (
                <path
                  d={c.d}
                  fill={active ? "#6b1520" : "#e8eaee"}
                  fillOpacity={active ? 0.9 : 1}
                  stroke={active ? "#0a1a33" : "#64748b"}
                  strokeWidth={active ? 1.6 : 0.9}
                  vectorEffect="non-scaling-stroke"
                  className="cursor-pointer transition-[fill] duration-150"
                  onMouseEnter={() => setHover(c.name)}
                  onMouseLeave={() => setHover(null)}
                />
              )}
              <text
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
            </g>
          );
        })}
      </svg>

      {/* Hover popup: the spec's six fields, rendered only when present. */}
      <div className="mt-4 min-h-[7rem] rounded-md border border-silver bg-cream p-4 text-sm">
        {hovered?.sheriff ? (
          <div className="space-y-1">
            <p className="font-display text-lg text-navy">{hovered.name} County Sheriff’s Office</p>
            <p><strong>Sheriff:</strong> {hovered.sheriff.sheriff}</p>
            <p><strong>Phone:</strong> {hovered.sheriff.phone}</p>
            {hovered.sheriff.fax ? <p><strong>Fax:</strong> {hovered.sheriff.fax}</p> : null}
            <p><strong>Address:</strong> {hovered.sheriff.address}</p>
            {hovered.sheriff.chpEmail ? <p><strong>CHP email:</strong> {hovered.sheriff.chpEmail}</p> : null}
            {hovered.sheriff.hours ? <p><strong>Hours:</strong> {hovered.sheriff.hours}</p> : null}
            {hovered.sheriff.website ? (
              <p>
                <strong>Website:</strong>{" "}
                <a href={hovered.sheriff.website} target="_blank" rel="noopener noreferrer" className="text-oxblood underline">{hovered.sheriff.website}</a>
              </p>
            ) : null}
            {hovered.sheriff.chpUrl ? (
              <p>
                <strong>CHP application:</strong>{" "}
                <a href={hovered.sheriff.chpUrl} target="_blank" rel="noopener noreferrer" className="text-oxblood underline">open application</a>
              </p>
            ) : null}
          </div>
        ) : (
          <p className="text-muted">
            Hover a county to see its sheriff’s office details. Click a county to open its CHP page.
            Fields marked “—” are not yet published by the county; call the office for CHP application details.
          </p>
        )}
      </div>
      <figcaption className="mt-3 text-sm text-muted">
        Source:{" "}
        <a href="https://www.coloradosheriffs.org/" target="_blank" rel="noopener noreferrer" className="text-oxblood hover:underline">
          County Sheriffs of Colorado
        </a>{" "}
        (OCV directory) · geometry from the 2021 redistricting plan
      </figcaption>
    </figure>
  );
}

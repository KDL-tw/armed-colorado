"use client";

import { useMemo, useState } from "react";
import { geoAlbersUsa, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import type { Topology, GeometryCollection } from "topojson-specification";
import type { FeatureCollection, Geometry } from "geojson";
import type { ReciprocityState } from "@/lib/chp/types";

/**
 * The committed us-atlas states-10m.json (data/us-states/states-10m.json):
 * `objects.states` is the 56-geometry collection; `objects.nation` is the
 * outline. Verified 2026-10-30: decoding the TopoJSON yields lon/lat
 * coordinates (NOT pre-projected), so `geoAlbersUsa().fitSize()` is the
 * correct single projection step.
 */
export type UsStatesTopology = Topology<{
  states: GeometryCollection<{ name: string }>;
  nation: GeometryCollection;
}>;

const COLORS = { full: "#15803d", none: "#b91c1c", partial: "#ca8a04", unknown: "#94a3b8" };

/**
 * Interactive US reciprocity map. `topology` is the committed
 * us-atlas states-10m TopoJSON (data/us-states/states-10m.json).
 * Hover a state for its status; the legend explains the color scheme.
 */
export function UsReciprocityMap({
  topology,
  states,
}: {
  topology: UsStatesTopology;
  states: ReciprocityState[];
}) {
  const [hover, setHover] = useState<string | null>(null);

  const { paths, statusByName } = useMemo(() => {
    // `feature()` returns a FeatureCollection; the `as unknown as` is the
    // verified-correct cast (a direct cast to GeometryCollection or a
    // FeatureCollection without `unknown` both fail tsc — checked 2026-10-30).
    const fc = feature(topology, topology.objects.states) as unknown as FeatureCollection<Geometry, { name: string }>;
    const projection = geoAlbersUsa().fitSize([975, 610], fc);
    const path = geoPath(projection);
    const statusByName = new Map(states.map((s) => [s.name, s]));
    const paths = fc.features.map((f): { name: string; d: string; status: keyof typeof COLORS; note?: string } => {
      const name = f.properties.name;
      const st = statusByName.get(name);
      return {
        name,
        d: path(f) ?? "",
        status: st?.status ?? "unknown",
        note: st?.note,
      };
    });
    return { paths, statusByName };
  }, [topology, states]);

  const hovered = hover ? statusByName.get(hover) : null;

  return (
    <figure>
      <figcaption aria-live="polite" className="mb-2 text-sm font-medium text-navy">
        {hovered ? (
          <span className="text-oxblood">
            {hovered.name}: {hovered.status === "full" ? "full reciprocity" : hovered.status === "none" ? "no reciprocity" : `partial — ${hovered.note ?? ""}`}
          </span>
        ) : (
          <span className="text-muted">Hover or tap a state to see its reciprocity status with Colorado</span>
        )}
      </figcaption>
      <svg viewBox="0 0 975 610" className="h-auto w-full" role="img" aria-label="Map of US states by reciprocity status with Colorado">
        {paths.map((p) => (
          <path
            key={p.name}
            d={p.d}
            fill={COLORS[p.status]}
            fillOpacity={hover === p.name ? 1 : 0.8}
            stroke="#ffffff"
            strokeWidth={0.7}
            vectorEffect="non-scaling-stroke"
            className="cursor-pointer transition-[fill-opacity] duration-150"
            onMouseEnter={() => setHover(p.name)}
            onMouseLeave={() => setHover(null)}
          />
        ))}
      </svg>
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm">
        <span className="flex items-center gap-2"><span className="inline-block h-3 w-3 rounded-sm" style={{ background: COLORS.full }} /> Full reciprocity</span>
        <span className="flex items-center gap-2"><span className="inline-block h-3 w-3 rounded-sm" style={{ background: COLORS.none }} /> No reciprocity</span>
        <span className="flex items-center gap-2"><span className="inline-block h-3 w-3 rounded-sm" style={{ background: COLORS.partial }} /> Partial / other</span>
      </div>
      <figcaption className="mt-3 text-sm text-muted">
        Source:{" "}
        <a href="https://cbi.colorado.gov/sections/firearms-instacheck-unit/concealed-handgun-permit-chp-reciprocity" target="_blank" rel="noopener noreferrer" className="text-oxblood hover:underline">
          CBI CHP Reciprocity
        </a>{" "}
        · C.R.S. 18-12-213
      </figcaption>
    </figure>
  );
}

/**
 * Fetch the official Colorado legislative district data and regenerate
 * data/districts/districts.json + manifest.json.
 *
 * Usage: npx tsx scripts/fetch-districts.ts
 * Exit codes: 0 = ok (files written), 1 = fetch/validate error,
 *             3 = NEW PLAN DETECTED — official shapefile links changed;
 *                 a human must update scripts/districts/sources.ts.
 */
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { SOURCES, type ChamberKey } from "./districts/sources";
import { simplifyRings, labelPoint, roundRings, roundPoint } from "./districts/geometry";
// Relative import — scripts/ convention (see scripts/assemble-catalog.ts).
import type { DistrictsData, DistrictsManifest, LonLat } from "../src/lib/districts/types";

const DATA_DIR = path.join(process.cwd(), "data", "districts");
const DP_TOLERANCE = 0.002; // degrees; tighten to 0.001 if file exceeds 1.2 MB

interface GeoJsonCollection {
  type: "FeatureCollection";
  features: { properties: Record<string, unknown>; geometry: { type: string; coordinates: unknown } }[];
}

async function fetchJson(url: string): Promise<unknown> {
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

/**
 * ArcGIS serves GeoJSON from the layer's /query subresource (verified 2026-10-28).
 * `serviceUrl` is the LAYER url (…/FeatureServer/0 or …/MapServer/5); the query
 * endpoint is `${serviceUrl}/query`. Hitting the layer url directly with f=geojson
 * returns HTTP 400 "Output format not supported" — do not drop the /query segment.
 */
async function fetchGeoJson(serviceUrl: string): Promise<GeoJsonCollection> {
  const url = `${serviceUrl}/query?where=1%3D1&outFields=%2A&outSR=4326&f=geojson&resultRecordCount=1000`;
  return (await fetchJson(url)) as GeoJsonCollection;
}

function geomToRings(geom: { type: string; coordinates: unknown }): LonLat[][][] {
  // LonLat[][][] = [polygon][ring][point]. A GeoJSON Polygon's coordinates are
  // [ring][point] — wrap in one polygon. A MultiPolygon's are already
  // [polygon][ring][point].
  if (geom.type === "Polygon") {
    return [(geom.coordinates as number[][][]).map((ring) => ring.map((v) => [v[0], v[1]] as LonLat))];
  }
  if (geom.type === "MultiPolygon") {
    return (geom.coordinates as number[][][][]).map((poly) =>
      poly.map((ring) => ring.map((v) => [v[0], v[1]] as LonLat)),
    );
  }
  throw new Error(`Unsupported geometry type: ${geom.type}`);
}

function extractShapefileUrl(html: string): string {
  // Verified against the live page HTML (2026-10-28): the shapefile link is a
  // custom element, NOT an <a>:
  //   Shapefile: <action-text-attachment sgid="..." content-type="application/zip"
  //       url="https://redistricting.colorado.gov/rails/active_storage/blobs/redirect/.../2021_Approved_House_Plan_w_Final_Adjustments.zip"
  //       filename="2021_Approved_House_Plan_w_Final_Adjustments.zip" filesize="...">
  const m = html.match(/Shapefile:\s*<action-text-attachment[^>]*url="([^"]+\.zip)"/);
  if (!m) throw new Error("Could not find the Shapefile link on the official page");
  return m[1];
}

async function main(): Promise<void> {
  // 0) New-plan detection: compare official shapefile links to the manifest.
  let manifest: DistrictsManifest | null = null;
  const manifestPath = path.join(DATA_DIR, "manifest.json");
  try {
    manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as DistrictsManifest;
  } catch {
    /* first run — no manifest yet */
  }
  if (manifest) {
    for (const key of ["house", "senate"] as const) {
      const page = await (await fetch(SOURCES[key].officialPageUrl)).text();
      const liveUrl = extractShapefileUrl(page);
      if (liveUrl !== manifest.officialShapefileUrls[key]) {
        console.error(
          `NEW PLAN DETECTED (${key}): official shapefile link changed.\n` +
          `  manifest: ${manifest.officialShapefileUrls[key]}\n` +
          `  live:     ${liveUrl}\n` +
          `A human must verify the new plan and update scripts/districts/sources.ts` +
          ` (planYear, service URLs, shapefile URLs), then re-run this script.`,
        );
        process.exit(3);
      }
    }
  }

  // 1) Fetch counties.
  const countiesFc = await fetchGeoJson(SOURCES.counties.serviceUrl);
  if (countiesFc.features.length !== SOURCES.counties.expectedCount) {
    throw new Error(
      `Counties: expected ${SOURCES.counties.expectedCount} features, got ${countiesFc.features.length}`,
    );
  }
  const counties = countiesFc.features.map((f) => ({
    name: String(f.properties[SOURCES.counties.nameField]),
    rings: roundRings(simplifyRings(geomToRings(f.geometry!), DP_TOLERANCE)),
  }));

  // 2) Fetch each chamber.
  const chambers = {} as Record<ChamberKey, DistrictsData["house"]>;
  for (const key of ["house", "senate"] as const) {
    const src = SOURCES[key];
    const fc = await fetchGeoJson(src.serviceUrl);
    if (fc.features.length !== src.expectedCount) {
      throw new Error(`${src.name}: expected ${src.expectedCount} features, got ${fc.features.length}`);
    }
    const districts = fc.features.map((f) => {
      const num = Number(f.properties[src.districtField]);
      if (!Number.isInteger(num) || num < 1 || num > src.expectedCount) {
        throw new Error(`${src.name}: bad district number ${num}`);
      }
      const rings = roundRings(simplifyRings(geomToRings(f.geometry!), DP_TOLERANCE));
      const overrides = (key === "house" ? SOURCES.houseLabelOverrides : SOURCES.senateLabelOverrides) as Record<number, LonLat>;
      return { district: num, rings, label: overrides[num] ?? roundPoint(labelPoint(rings)) };
    });
    districts.sort((a, b) => a.district - b.district);
    const nums = new Set(districts.map((d) => d.district));
    for (let i = 1; i <= src.expectedCount; i++) {
      if (!nums.has(i)) throw new Error(`${src.name}: missing district ${i}`);
    }
    chambers[key] = {
      sourceUrl: src.serviceUrl,
      interactiveMapUrl: src.interactiveMapUrl,
      districts,
    };
  }

  // 3) Write data + manifest.
  const data: DistrictsData = {
    planYear: SOURCES.planYear,
    effectiveSince: SOURCES.effectiveSince,
    fetchedAt: new Date().toISOString(),
    house: chambers.house,
    senate: chambers.senate,
    counties,
  };
  mkdirSync(DATA_DIR, { recursive: true });
  const dataPath = path.join(DATA_DIR, "districts.json");
  const json = JSON.stringify(data);
  writeFileSync(dataPath, json);
  const sizeMb = Buffer.byteLength(json) / (1024 * 1024);
  if (sizeMb > 1.2) {
    throw new Error(
      `districts.json is ${sizeMb.toFixed(2)} MB (> 1.2 MB budget). ` +
      `Tighten DP_TOLERANCE in scripts/fetch-districts.ts (try 0.001) and re-run.`,
    );
  }
  const newManifest: DistrictsManifest = {
    planYear: SOURCES.planYear,
    fetchedAt: data.fetchedAt,
    sha256: createHash("sha256").update(json).digest("hex"),
    officialShapefileUrls: {
      house: SOURCES.house.officialShapefileUrl,
      senate: SOURCES.senate.officialShapefileUrl,
    },
  };
  writeFileSync(manifestPath, JSON.stringify(newManifest, null, 2));
  console.log(
    `Wrote ${dataPath} (${sizeMb.toFixed(2)} MB): ` +
    `${data.house.districts.length} house districts, ` +
    `${data.senate.districts.length} senate districts, ` +
    `${data.counties.length} counties.`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

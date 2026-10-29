export type LonLat = [number, number];

export interface DistrictFeature {
  district: number;
  /** Polygons; each polygon = [outerRing, ...holes]; each ring = LonLat[]. */
  rings: LonLat[][][];
  /** Where the district number is drawn. */
  label: LonLat;
}

export interface CountyFeature {
  name: string;
  rings: LonLat[][][];
}

export interface ChamberData {
  sourceUrl: string;
  interactiveMapUrl: string;
  districts: DistrictFeature[];
}

export interface DistrictsData {
  planYear: number;
  effectiveSince: string;
  fetchedAt: string;
  house: ChamberData;
  senate: ChamberData;
  counties: CountyFeature[];
}

export interface DistrictsManifest {
  planYear: number;
  fetchedAt: string;
  sha256: string;
  officialShapefileUrls: { house: string; senate: string };
}

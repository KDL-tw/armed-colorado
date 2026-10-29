/**
 * Single source of truth for the district-map data pipeline.
 * When a NEW redistricting plan is published (next cycle: after the 2030
 * census), update `planYear`, the feature-service URLs, and the official
 * shapefile URLs here, then run `npm run fetch-districts`.
 *
 * Verified live 2026-10-28:
 *  - House service: 65 polygons, field DISTRICT (1-65)
 *  - Senate service: 35 polygons, field DISTRICT (1-35)
 *  - Counties service (CDPHE): 64 polygons, field COUNTY (UPPERCASE, includes
 *    Denver). The coleg WFL1/3 layer was rejected: 63 features, no Denver.
 */
export interface ChamberSource {
  name: string;
  serviceUrl: string;
  districtField: string;
  expectedCount: number;
  officialPageUrl: string;
  officialShapefileUrl: string;
  interactiveMapUrl: string;
}

export const SOURCES = {
  planYear: 2021,
  effectiveSince: "2022",
  house: {
    name: "House",
    serviceUrl:
      "https://services3.arcgis.com/1V8429k2MaAcIZUa/arcgis/rest/services/House_Final_Plan/FeatureServer/0",
    districtField: "DISTRICT",
    expectedCount: 65,
    officialPageUrl: "https://redistricting.colorado.gov/content/house-final-approved",
    officialShapefileUrl:
      "https://redistricting.colorado.gov/rails/active_storage/blobs/redirect/eyJfcmFpbHMiOnsiZGF0YSI6OTU5LCJwdXIiOiJibG9iX2lkIn19--5a9193ab75042aa2c28791758b9d36739e90fd96/2021_Approved_House_Plan_w_Final_Adjustments.zip",
    interactiveMapUrl:
      "https://coleg.maps.arcgis.com/apps/View/index.html?appid=41b742a9931a4c87a6e43b01c734c0c9",
  },
  senate: {
    name: "Senate",
    serviceUrl:
      "https://services3.arcgis.com/1V8429k2MaAcIZUa/arcgis/rest/services/2021_Final_Approved_Senate_Plan_Errata/FeatureServer/0",
    districtField: "DISTRICT",
    expectedCount: 35,
    officialPageUrl:
      "https://redistricting.colorado.gov/content/senate-final-approved-errata",
    officialShapefileUrl:
      "https://redistricting.colorado.gov/rails/active_storage/blobs/redirect/eyJfcmFpbHMiOnsiZGF0YSI6OTYxLCJwdXIiOiJibG9iX2lkIn19--c1605eb537a59d70d2cd8c30ff743e96bffd5f1f/2021_Approved_Senate_Plan_w_Final_Adjustments.zip",
    interactiveMapUrl:
      "https://coleg.maps.arcgis.com/apps/View/index.html?appid=e651bcd208074533a11152b4690024bc",
  },
  counties: {
    // CDPHE (state Dept. of Public Health & Environment) — verified 2026-10-28:
    // 64 features, field COUNTY, UPPERCASE names with spaces ("CLEAR CREEK").
    // The coleg WFL1/3 layer was rejected: 63 features, no Denver.
    serviceUrl:
      "https://www.cohealthmaps.dphe.state.co.us/arcgis/rest/services/OPEN_DATA/cdphe_geographic_analysis_boundaries/MapServer/5",
    nameField: "COUNTY",
    expectedCount: 64,
  },
  metros: {
    denver: {
      title: "Denver Metro",
      counties: [
        "ADAMS", "ARAPAHOE", "BOULDER", "BROOMFIELD", "CLEAR CREEK",
        "DENVER", "DOUGLAS", "GILPIN", "JEFFERSON",
      ],
    },
    springs: {
      title: "Colorado Springs Metro",
      counties: ["EL PASO", "TELLER"],
    },
  },
  // Optional manual label overrides: district number -> [lon, lat].
  // Use ONLY if a computed centroid lands outside its district (check in Task 7).
  houseLabelOverrides: {} as Record<number, [number, number]>,
  senateLabelOverrides: {} as Record<number, [number, number]>,
};

export type ChamberKey = "house" | "senate";

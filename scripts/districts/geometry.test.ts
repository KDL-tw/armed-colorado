import { simplifyRing, ringCentroid, labelPoint, ringsToPath, makeProjector } from "./geometry";

function assert(cond: boolean, msg: string): void {
  if (!cond) throw new Error(`ASSERT: ${msg}`);
}

// DP: a straight line with a mid-bump keeps the bump, drops the flat points.
// Contract: input ring is closed (last point duplicates the first); the output
// ring is ALSO closed — it ends with a duplicate of the FIRST point.
const line: [number, number][] = [
  [0, 0], [0.1, 0.0001], [0.2, 0], [0.3, 0.5], [0.4, 0.0001], [0.5, 0], [0, 0],
];
const simplified = simplifyRing(line, 0.05);
assert(simplified.length < line.length, "DP removes collinear points");
assert(simplified[0][0] === 0 && simplified[0][1] === 0, "DP keeps first point");
assert(
  simplified[simplified.length - 1][0] === simplified[0][0] &&
    simplified[simplified.length - 1][1] === simplified[0][1],
  "output ring is closed (last === first)",
);
assert(simplified.some((p) => p[1] === 0.5), "DP keeps the bump");
assert(simplified.some((p) => p[0] === 0.5 && p[1] === 0), "DP keeps the far endpoint");

// Centroid of a unit square ring = (0.5, 0.5).
const sq: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]];
const c = ringCentroid(sq);
assert(Math.abs(c[0] - 0.5) < 1e-9 && Math.abs(c[1] - 0.5) < 1e-9, "square centroid");

// labelPoint picks the largest ring (strictly larger — a tie keeps the first).
const smallRing: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]];
const bigRing: [number, number][] = [];
for (let i = 0; i < 12; i++) {
  const a = (i / 12) * 2 * Math.PI;
  bigRing.push([5 + Math.cos(a), 5 + Math.sin(a)]);
}
bigRing.push(bigRing[0]); // close it
// labelPoint takes ONE feature's rings: LonLat[][][] = [polygon][ring][point].
// Two polygons, one ring each.
const lp = labelPoint([[smallRing], [bigRing]]);
// Tolerance: vertex means of a regular 12-gon are (5,5) only in exact
// arithmetic; floating-point cos/sin leave ~1e-15 residue.
assert(
  Math.abs(lp[0] - 5) < 1e-9 && Math.abs(lp[1] - 5) < 1e-9,
  "label uses largest ring (centroid of the 12-gon at (5,5))",
);

// Path generation: closed, projected, 3-decimal.
const project = makeProjector(-110, 41, 100);
const d = ringsToPath([[[[ -110, 41 ], [ -109, 41 ], [ -109, 40 ], [ -110, 40 ], [ -110, 41 ]]]], project);
assert(d.startsWith("M") && d.endsWith("Z"), "path is closed");
assert(d.includes("0.000,0.000"), "first point projects to origin");

console.log("geometry.test: all assertions passed");

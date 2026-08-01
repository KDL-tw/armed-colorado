"use client";

type Poly = {
  points: string;
  fill: string;
  float: number; // 1–12 animation variant
};

const TOP_BAND: Poly[] = [
  { points: "0,0 320,0 280,95 0,120", fill: "#0a1a33", float: 1 },
  { points: "300,0 620,0 590,70 340,110 280,95", fill: "#0d2240", float: 2 },
  { points: "600,0 880,0 910,85 700,55 590,70", fill: "#0a1a33", float: 3 },
  { points: "860,0 1200,0 1200,130 1040,100 910,85", fill: "#061122", float: 4 },
  { points: "180,90 340,110 310,175 90,155", fill: "#0a1a33", float: 5 },
  { points: "700,55 910,85 860,160 640,140", fill: "#122846", float: 6 },
  { points: "1040,100 1200,130 1200,200 980,170", fill: "#0a1a33", float: 7 },
];

const BOTTOM_BAND: Poly[] = [
  { points: "0,680 260,650 300,800 0,800", fill: "#0a1a33", float: 8 },
  { points: "240,660 520,690 480,800 300,800", fill: "#061122", float: 9 },
  { points: "500,700 780,670 820,800 480,800", fill: "#0a1a33", float: 10 },
  { points: "760,675 1020,710 980,800 820,800", fill: "#122846", float: 11 },
  { points: "1000,700 1200,660 1200,800 980,800", fill: "#0a1a33", float: 12 },
  { points: "140,620 320,640 280,710 80,690", fill: "#0d2240", float: 1 },
  { points: "620,640 860,620 820,710 580,690", fill: "#0a1a33", float: 3 },
];

const SILVER: Poly[] = [
  { points: "80,280 160,260 150,320 70,330", fill: "#c5cad3", float: 4 },
  { points: "980,300 1120,280 1100,360 960,340", fill: "#c5cad3", float: 7 },
  { points: "200,480 360,460 340,510 190,520", fill: "#9aa3b2", float: 10 },
];

const C_FILLS = ["#6b1520", "#5a111a", "#7a1a26", "#4a0e16", "#6b1520"] as const;

/** Build a granular oxblood C (open on the right) from many small radial quads. */
function buildCFacets(): Poly[] {
  const cx = 620;
  const cy = 390;
  const fills = C_FILLS;
  const facets: Poly[] = [];

  // Clockwise long arc: top tip → left → bottom tip (gap on the east = C mouth)
  const angles: number[] = [];
  for (let a = -52; a >= -180; a -= 5) angles.push(a);
  for (let a = 180; a >= 52; a -= 5) angles.push(a);

  const polar = (r: number, deg: number) => {
    const rad = (deg * Math.PI) / 180;
    return `${(cx + r * Math.cos(rad)).toFixed(1)},${(cy + r * Math.sin(rad)).toFixed(1)}`;
  };

  // Outer ring of small quads
  for (let i = 0; i < angles.length - 1; i++) {
    const a0 = angles[i];
    const a1 = angles[i + 1];
    const ro0 = 168 + (i % 3 === 0 ? 8 : i % 3 === 1 ? -5 : 3);
    const ro1 = 168 + (i % 3 === 0 ? -4 : i % 3 === 1 ? 7 : -2);
    const ri0 = 118 + (i % 2 === 0 ? -4 : 5);
    const ri1 = 118 + (i % 2 === 0 ? 6 : -3);
    facets.push({
      points: `${polar(ro0, a0)} ${polar(ro1, a1)} ${polar(ri1, a1)} ${polar(ri0, a0)}`,
      fill: fills[i % fills.length],
      float: (i % 12) + 1,
    });
  }

  // Inner staggered chips for more grain (slightly inset, every other step)
  for (let i = 0; i < angles.length - 2; i += 2) {
    const a0 = angles[i] + 1.2;
    const a1 = angles[i + 1] - 0.8;
    const ro0 = 124 + (i % 4 === 0 ? 5 : -3);
    const ro1 = 124 + (i % 4 === 0 ? -2 : 4);
    const ri0 = 98 + (i % 2 === 0 ? 3 : -2);
    const ri1 = 98 + (i % 2 === 0 ? -4 : 2);
    facets.push({
      points: `${polar(ro0, a0)} ${polar(ro1, a1)} ${polar(ri1, a1)} ${polar(ri0, a0)}`,
      fill: fills[(i + 2) % fills.length],
      float: ((i + 3) % 12) + 1,
    });
  }

  // Tiny terminal chips at the open mouth tips
  facets.push(
    {
      points: `${polar(172, -48)} ${polar(155, -42)} ${polar(130, -46)} ${polar(148, -54)}`,
      fill: "#7a1a26",
      float: 2,
    },
    {
      points: `${polar(170, 48)} ${polar(152, 42)} ${polar(128, 46)} ${polar(146, 54)}`,
      fill: "#7a1a26",
      float: 6,
    },
    {
      points: `${polar(160, -55)} ${polar(148, -50)} ${polar(135, -56)} ${polar(145, -62)}`,
      fill: "#4a0e16",
      float: 9,
    },
    {
      points: `${polar(158, 55)} ${polar(146, 50)} ${polar(133, 56)} ${polar(143, 62)}`,
      fill: "#4a0e16",
      float: 11,
    },
  );

  return facets;
}

const C_FACETS: Poly[] = buildCFacets();

const AMBER_CORE: Poly[] = [
  {
    points: "580,330 640,305 700,325 720,385 690,445 625,460 565,420 555,360",
    fill: "#c47a12",
    float: 9,
  },
  { points: "580,330 640,305 655,360 590,355", fill: "#d4891a", float: 12 },
  { points: "690,445 720,385 705,415", fill: "#8f5608", float: 2 },
];

function FloatPoly({ points, fill, float, opacity }: Poly & { opacity?: number }) {
  return (
    <g
      className={`float-${float}`}
      style={{ transformBox: "fill-box", transformOrigin: "center" }}
    >
      <polygon points={points} fill={fill} opacity={opacity} />
    </g>
  );
}

/**
 * Polygonal Colorado flag field — blue bands, white field, oxblood C, amber core.
 * Each block floats on its own path.
 */
export function PolygonalColoradoField({
  className = "",
  intensity = "full",
}: {
  className?: string;
  intensity?: "full" | "soft";
}) {
  const soft = intensity === "soft";
  const bandOp = soft ? 0.5 : 0.92;
  const cOp = soft ? 0.72 : 1;
  const silverOp = soft ? 0.22 : 0.38;

  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      aria-hidden
    >
      <svg
        className="h-full w-full"
        viewBox="0 0 1200 800"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <style>{`
            @keyframes float1 {
              0% { transform: translate(0px, 0px) rotate(0deg); }
              50% { transform: translate(18px, -14px) rotate(1.2deg); }
              100% { transform: translate(-8px, 10px) rotate(-0.8deg); }
            }
            @keyframes float2 {
              0% { transform: translate(0px, 0px) rotate(0deg); }
              50% { transform: translate(-16px, 12px) rotate(-1.5deg); }
              100% { transform: translate(10px, -9px) rotate(1deg); }
            }
            @keyframes float3 {
              0% { transform: translate(0px, 0px) rotate(0deg); }
              33% { transform: translate(12px, 16px) rotate(0.6deg); }
              66% { transform: translate(-14px, -6px) rotate(-1deg); }
              100% { transform: translate(6px, -12px) rotate(0.4deg); }
            }
            @keyframes float4 {
              0% { transform: translate(0px, 0px); }
              50% { transform: translate(-20px, -10px); }
              100% { transform: translate(14px, 8px); }
            }
            @keyframes float5 {
              0% { transform: translate(0px, 0px) rotate(0deg); }
              50% { transform: translate(10px, 18px) rotate(2deg); }
              100% { transform: translate(-12px, -8px) rotate(-1.2deg); }
            }
            @keyframes float6 {
              0% { transform: translate(0px, 0px); }
              40% { transform: translate(22px, 4px); }
              100% { transform: translate(-10px, -16px); }
            }
            @keyframes float7 {
              0% { transform: translate(0px, 0px) rotate(0deg); }
              50% { transform: translate(-8px, 20px) rotate(-2deg); }
              100% { transform: translate(16px, -6px) rotate(1deg); }
            }
            @keyframes float8 {
              0% { transform: translate(0px, 0px); }
              50% { transform: translate(8px, -22px); }
              100% { transform: translate(-18px, 12px); }
            }
            @keyframes float9 {
              0% { transform: translate(0px, 0px) rotate(0deg); }
              50% { transform: translate(-14px, -12px) rotate(1.5deg); }
              100% { transform: translate(12px, 14px) rotate(-1deg); }
            }
            @keyframes float10 {
              0% { transform: translate(0px, 0px); }
              35% { transform: translate(16px, 8px); }
              70% { transform: translate(-6px, -18px); }
              100% { transform: translate(4px, 10px); }
            }
            @keyframes float11 {
              0% { transform: translate(0px, 0px) rotate(0deg); }
              50% { transform: translate(20px, -4px) rotate(-1.8deg); }
              100% { transform: translate(-12px, 16px) rotate(0.9deg); }
            }
            @keyframes float12 {
              0% { transform: translate(0px, 0px); }
              50% { transform: translate(-10px, 14px); }
              100% { transform: translate(18px, -10px); }
            }
            .float-1 { animation: float1 28s ease-in-out infinite alternate; }
            .float-2 { animation: float2 34s ease-in-out infinite alternate; }
            .float-3 { animation: float3 24s ease-in-out infinite alternate; }
            .float-4 { animation: float4 38s ease-in-out infinite alternate; }
            .float-5 { animation: float5 26s ease-in-out infinite alternate; }
            .float-6 { animation: float6 36s ease-in-out infinite alternate; }
            .float-7 { animation: float7 30s ease-in-out infinite alternate; }
            .float-8 { animation: float8 40s ease-in-out infinite alternate; }
            .float-9 { animation: float9 22s ease-in-out infinite alternate; }
            .float-10 { animation: float10 42s ease-in-out infinite alternate; }
            .float-11 { animation: float11 32s ease-in-out infinite alternate; }
            .float-12 { animation: float12 35s ease-in-out infinite alternate; }
          `}</style>
        </defs>

        <rect width="1200" height="800" fill={soft ? "#f7f6f3" : "#faf9f6"} />

        {TOP_BAND.map((p) => (
          <FloatPoly key={`t-${p.points}`} {...p} opacity={bandOp} />
        ))}
        {BOTTOM_BAND.map((p) => (
          <FloatPoly key={`b-${p.points}`} {...p} opacity={bandOp} />
        ))}
        {SILVER.map((p) => (
          <FloatPoly key={`s-${p.points}`} {...p} opacity={silverOp} />
        ))}
        {C_FACETS.map((p) => (
          <FloatPoly key={`c-${p.points}`} {...p} opacity={cOp} />
        ))}
        {AMBER_CORE.map((p) => (
          <FloatPoly key={`a-${p.points}`} {...p} opacity={cOp} />
        ))}
      </svg>
    </div>
  );
}

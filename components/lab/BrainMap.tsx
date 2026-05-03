"use client";

import { petColor } from "@/lib/lab/petColor";
import type { LabRegion } from "@/lib/lab/data";

const SAGITTAL_PATH =
  "M 18 50 C 16 32, 32 14, 52 16 C 70 17, 84 28, 86 42 C 87 50, 86 56, 82 62 C 80 66, 78 70, 80 74 C 82 78, 78 82, 72 82 L 28 82 C 22 82, 18 78, 18 72 Z";
const CEREBELLUM_PATH =
  "M 70 76 C 78 76, 84 80, 84 86 C 84 90, 78 92, 70 90 C 64 88, 64 78, 70 76 Z";
const SULCI = [
  "M 24 38 q 8 -6 18 -2",
  "M 30 30 q 10 -8 22 -2",
  "M 44 22 q 12 -2 22 6",
  "M 60 22 q 8 6 14 16",
  "M 28 56 q 10 -4 22 0",
  "M 24 68 q 16 -2 30 4",
];

const AXIAL_OUTER =
  "M 50 10 C 76 10, 90 28, 90 50 C 90 72, 76 90, 50 90 C 24 90, 10 72, 10 50 C 10 28, 24 10, 50 10 Z";
const AXIAL_MIDLINE = "M 50 11 C 49 30, 51 70, 50 89";
const AXIAL_SULCI = [
  "M 22 30 q 10 -4 18 0",
  "M 60 30 q 8 -4 18 0",
  "M 18 50 q 10 -2 18 2",
  "M 64 50 q 10 4 18 2",
  "M 22 70 q 10 4 18 0",
  "M 60 70 q 10 4 18 0",
];

const SAGITTAL_REMAP: Record<string, { x: number; y: number }> = {
  hippo: { x: 52, y: 56 },
  amyg: { x: 46, y: 60 },
  vis: { x: 78, y: 50 },
  temp: { x: 38, y: 64 },
  fusi: { x: 58, y: 70 },
  rew: { x: 52, y: 50 },
  pfc: { x: 28, y: 38 },
  motor: { x: 50, y: 30 },
};

export type BrainView = "axial" | "sagittal" | "abstract";

function Cluster({
  region,
  hovered,
  scale = 1,
}: {
  region: LabRegion;
  hovered: boolean;
  scale?: number;
}) {
  const color = petColor(region.score);
  const intensity = 0.35 + (region.score / 100) * 0.55;
  const r = region.r * scale * (hovered ? 1.15 : 1);
  return (
    <g
      style={{
        transition: "transform 200ms ease",
        transformOrigin: `${region.x}px ${region.y}px`,
      }}
    >
      <circle
        cx={region.x}
        cy={region.y}
        r={r * 1.9}
        fill={color}
        opacity={hovered ? intensity * 0.45 : intensity * 0.25}
        filter="url(#blob-blur-lg)"
      />
      <circle
        cx={region.x}
        cy={region.y}
        r={r * 1.2}
        fill={color}
        opacity={intensity * 0.7}
        filter="url(#blob-blur-md)"
      />
      <circle
        cx={region.x}
        cy={region.y}
        r={r * 0.55}
        fill={color}
        opacity={Math.min(1, intensity * 1.2)}
        filter="url(#blob-blur-sm)"
      />
      {hovered && (
        <circle
          cx={region.x}
          cy={region.y}
          r={r * 2.1}
          fill="none"
          stroke="#1A1A1B"
          strokeWidth="0.4"
          strokeDasharray="1 1.5"
          opacity="0.7"
        />
      )}
    </g>
  );
}

function AbstractGraph({
  regions,
  hoveredKey,
}: {
  regions: LabRegion[];
  hoveredKey: string | null;
}) {
  const N = regions.length;
  const placed = regions.map((r, i) => {
    const a = (i / N) * Math.PI * 2 - Math.PI / 2;
    return { ...r, ax: 50 + Math.cos(a) * 32, ay: 50 + Math.sin(a) * 32 };
  });
  const edges: [string, string][] = [
    ["hippo", "amyg"],
    ["amyg", "rew"],
    ["vis", "fusi"],
    ["vis", "temp"],
    ["rew", "pfc"],
    ["pfc", "motor"],
    ["hippo", "temp"],
    ["fusi", "amyg"],
  ];
  return (
    <>
      {edges.map(([a, b], i) => {
        const A = placed.find((p) => p.key === a);
        const B = placed.find((p) => p.key === b);
        if (!A || !B) return null;
        return (
          <line
            key={i}
            x1={A.ax}
            y1={A.ay}
            x2={B.ax}
            y2={B.ay}
            stroke="#1A1A1B"
            strokeWidth="0.25"
            opacity="0.3"
          />
        );
      })}
      {placed.map((r) => (
        <g key={r.key}>
          <circle
            cx={r.ax}
            cy={r.ay}
            r={4 + r.score / 25}
            fill={petColor(r.score)}
            opacity={hoveredKey === r.key ? 1 : 0.85}
          />
          <circle
            cx={r.ax}
            cy={r.ay}
            r={4 + r.score / 25}
            fill="none"
            stroke="#1A1A1B"
            strokeWidth="0.3"
          />
          <text
            x={r.ax}
            y={r.ay + 1}
            fontSize="2.6"
            fontFamily="var(--font-jbm)"
            textAnchor="middle"
            fill="#F9F9F7"
          >
            {r.score}
          </text>
        </g>
      ))}
    </>
  );
}

export function BrainMap({
  regions,
  view = "axial",
  hoveredKey,
  onHover,
  compact = false,
}: {
  regions: LabRegion[];
  view?: BrainView;
  hoveredKey: string | null;
  onHover?: (k: string | null) => void;
  compact?: boolean;
}) {
  const size = compact ? 280 : 320;
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <svg
        viewBox="0 0 100 100"
        width={size}
        height={size}
        style={{ display: "block", maxWidth: "100%" }}
      >
        <defs>
          <filter id="blob-blur-lg" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3.2" />
          </filter>
          <filter id="blob-blur-md" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1.8" />
          </filter>
          <filter id="blob-blur-sm" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="0.8" />
          </filter>
          <clipPath id="brain-clip-axial">
            <path d={AXIAL_OUTER} />
          </clipPath>
          <clipPath id="brain-clip-sagittal">
            <path d={SAGITTAL_PATH} />
          </clipPath>
          <pattern id="grain" x="0" y="0" width="4" height="4" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="0.18" fill="#1A1A1B" opacity="0.25" />
            <circle cx="3" cy="3" r="0.12" fill="#1A1A1B" opacity="0.18" />
          </pattern>
        </defs>

        <g opacity="0.18" stroke="#1A1A1B" strokeWidth="0.18">
          <line x1="50" y1="0" x2="50" y2="100" strokeDasharray="0.6 1.4" />
          <line x1="0" y1="50" x2="100" y2="50" strokeDasharray="0.6 1.4" />
          <circle cx="50" cy="50" r="42" fill="none" strokeDasharray="0.5 1.5" />
          <circle cx="50" cy="50" r="28" fill="none" strokeDasharray="0.5 1.5" />
          <circle cx="50" cy="50" r="14" fill="none" strokeDasharray="0.5 1.5" />
        </g>

        {view === "axial" ? (
          <>
            <path d={AXIAL_OUTER} fill="#FBFBF9" stroke="#1A1A1B" strokeWidth="0.5" />
            <g clipPath="url(#brain-clip-axial)">
              <rect x="0" y="0" width="100" height="100" fill="url(#grain)" opacity="0.4" />
              {regions.map((r) => (
                <Cluster key={r.key} region={r} hovered={hoveredKey === r.key} />
              ))}
            </g>
            <g
              clipPath="url(#brain-clip-axial)"
              stroke="#1A1A1B"
              strokeWidth="0.25"
              fill="none"
              opacity="0.55"
            >
              {AXIAL_SULCI.map((d, i) => (
                <path key={i} d={d} />
              ))}
              <path d={AXIAL_MIDLINE} strokeWidth="0.4" opacity="0.8" />
            </g>
            <path d={AXIAL_OUTER} fill="none" stroke="#1A1A1B" strokeWidth="0.6" />
            <text x="50" y="6" textAnchor="middle" fontSize="2.4" fontFamily="var(--font-jbm)" fill="#7A7B80" letterSpacing="0.5">
              ANTERIOR
            </text>
            <text x="50" y="97" textAnchor="middle" fontSize="2.4" fontFamily="var(--font-jbm)" fill="#7A7B80" letterSpacing="0.5">
              POSTERIOR
            </text>
            <text x="6" y="51" fontSize="2.4" fontFamily="var(--font-jbm)" fill="#7A7B80">
              L
            </text>
            <text x="92" y="51" fontSize="2.4" fontFamily="var(--font-jbm)" fill="#7A7B80">
              R
            </text>
          </>
        ) : view === "sagittal" ? (
          <>
            <path d={SAGITTAL_PATH} fill="#FBFBF9" stroke="#1A1A1B" strokeWidth="0.5" />
            <path d={CEREBELLUM_PATH} fill="#FBFBF9" stroke="#1A1A1B" strokeWidth="0.5" />
            <g clipPath="url(#brain-clip-sagittal)">
              <rect x="0" y="0" width="100" height="100" fill="url(#grain)" opacity="0.4" />
              {regions.map((r) => {
                const pos = SAGITTAL_REMAP[r.key] || { x: r.x, y: r.y };
                return (
                  <Cluster
                    key={r.key}
                    region={{ ...r, x: pos.x, y: pos.y }}
                    hovered={hoveredKey === r.key}
                  />
                );
              })}
            </g>
            <g
              stroke="#1A1A1B"
              strokeWidth="0.25"
              fill="none"
              opacity="0.55"
              clipPath="url(#brain-clip-sagittal)"
            >
              {SULCI.map((d, i) => (
                <path key={i} d={d} />
              ))}
            </g>
            <path d={SAGITTAL_PATH} fill="none" stroke="#1A1A1B" strokeWidth="0.6" />
            <path d={CEREBELLUM_PATH} fill="none" stroke="#1A1A1B" strokeWidth="0.6" />
            <path d="M 48 82 q 0 6 -2 14" fill="none" stroke="#1A1A1B" strokeWidth="0.5" />
            <text x="50" y="6" textAnchor="middle" fontSize="2.4" fontFamily="var(--font-jbm)" fill="#7A7B80">
              SUPERIOR
            </text>
            <text x="6" y="51" fontSize="2.4" fontFamily="var(--font-jbm)" fill="#7A7B80">
              A
            </text>
            <text x="92" y="51" fontSize="2.4" fontFamily="var(--font-jbm)" fill="#7A7B80">
              P
            </text>
          </>
        ) : (
          <AbstractGraph regions={regions} hoveredKey={hoveredKey} />
        )}

        {regions.map((r) => {
          let pos = { x: r.x, y: r.y };
          if (view === "sagittal") {
            pos = SAGITTAL_REMAP[r.key] || pos;
          }
          return (
            <circle
              key={r.key}
              cx={pos.x}
              cy={pos.y}
              r={r.r * 1.6}
              fill="transparent"
              style={{ cursor: "pointer" }}
              onMouseEnter={() => onHover && onHover(r.key)}
              onMouseLeave={() => onHover && onHover(null)}
            />
          );
        })}

        {hoveredKey &&
          (() => {
            const r = regions.find((x) => x.key === hoveredKey);
            if (!r) return null;
            let pos = { x: r.x, y: r.y };
            if (view === "sagittal") {
              pos = SAGITTAL_REMAP[r.key] || pos;
            }
            const labelX = pos.x > 50 ? pos.x + 8 : pos.x - 8;
            const anchor = pos.x > 50 ? "start" : "end";
            return (
              <g style={{ pointerEvents: "none" }}>
                <line
                  x1={pos.x}
                  y1={pos.y}
                  x2={labelX}
                  y2={pos.y - 6}
                  stroke="#1A1A1B"
                  strokeWidth="0.3"
                />
                <line
                  x1={labelX}
                  y1={pos.y - 6}
                  x2={pos.x > 50 ? labelX + 14 : labelX - 14}
                  y2={pos.y - 6}
                  stroke="#1A1A1B"
                  strokeWidth="0.3"
                />
                <text
                  x={pos.x > 50 ? labelX + 1 : labelX - 1}
                  y={pos.y - 7}
                  fontSize="2.6"
                  fontFamily="var(--font-jbm)"
                  fill="#1A1A1B"
                  textAnchor={anchor}
                >
                  {r.name.toUpperCase()}
                </text>
                <text
                  x={pos.x > 50 ? labelX + 1 : labelX - 1}
                  y={pos.y - 4}
                  fontSize="2.2"
                  fontFamily="var(--font-jbm)"
                  fill="#7A7B80"
                  textAnchor={anchor}
                >
                  {String(r.score).padStart(2, "0")} / 100
                </text>
              </g>
            );
          })()}
      </svg>
    </div>
  );
}

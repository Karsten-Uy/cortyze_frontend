// Top-down (axial) brain SVG — shared across the analysis animation,
// the score-card watermark, and the per-suggestion mini-diagram.

import { REGION_META, type RegionKey, type Tone } from "@/lib/cortyze-data";

type Props = {
  size?: number;
  activeKeys?: RegionKey[];
  intensity?: Partial<Record<RegionKey, number>>;
  pulseKey?: RegionKey | null;
  tone?: Tone;
  outlineColor?: string;
  innerColor?: string;
  showAll?: boolean;
};

export function BrainSvg({
  size = 200,
  activeKeys = [],
  intensity = {},
  pulseKey = null,
  tone = "coral",
  outlineColor = "#D9D5CE",
  innerColor = "#E3E0D9",
  showAll = false,
}: Props) {
  const accent = tone === "green" ? "#0F6E56" : "#D4613E";
  const accentRGB = tone === "green" ? "15, 110, 86" : "212, 97, 62";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      style={{ display: "block" }}
    >
      {/* Outer brain silhouette */}
      <ellipse
        cx="100"
        cy="105"
        rx="78"
        ry="88"
        fill="none"
        stroke={outlineColor}
        strokeWidth="2"
      />
      {/* Inner structure hints */}
      <ellipse
        cx="100"
        cy="105"
        rx="58"
        ry="70"
        fill="none"
        stroke={innerColor}
        strokeWidth="1"
      />
      <path
        d="M 100 22 Q 100 100 100 192"
        fill="none"
        stroke={innerColor}
        strokeWidth="1"
      />
      <path
        d="M 30 80 Q 100 95 170 80"
        fill="none"
        stroke={innerColor}
        strokeWidth="0.8"
        opacity="0.6"
      />
      <path
        d="M 30 130 Q 100 115 170 130"
        fill="none"
        stroke={innerColor}
        strokeWidth="0.8"
        opacity="0.6"
      />

      {REGION_META.map((r) => {
        const isActive = activeKeys.includes(r.key) || showAll;
        const isPulse = pulseKey === r.key;
        if (!isActive && !isPulse) return null;
        const inten = intensity[r.key] ?? 0.3;
        const fill = `rgba(${accentRGB}, ${inten})`;
        return (
          <ellipse
            key={r.key}
            cx={r.pos.cx}
            cy={r.pos.cy}
            rx={r.pos.rx}
            ry={r.pos.ry}
            fill={fill}
            stroke={accent}
            strokeWidth={isPulse ? 1.5 : 1}
            style={
              isPulse
                ? {
                    transformOrigin: `${r.pos.cx}px ${r.pos.cy}px`,
                    animation: "cortyzePulse 2s ease-in-out infinite",
                  }
                : { transition: "all 400ms ease" }
            }
          />
        );
      })}
    </svg>
  );
}

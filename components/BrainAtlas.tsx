// Six-region anatomical atlas (dorsal view). Replaces the earlier
// schematic BrainSvg in the loading screen and the results page.

import type { CSSProperties } from "react";

import type { RegionKey, Tone } from "@/lib/cortyze-data";

type Props = {
  size?: number;
  activeKeys?: RegionKey[];
  intensity?: Partial<Record<RegionKey, number>>;
  pulseKey?: RegionKey | null;
  tone?: Tone;
  showAll?: boolean;
  showBadges?: boolean;
  showLabelImage?: boolean;
};

const VIEW_W = 464;
const VIEW_H = 588;

const REGIONS: Record<RegionKey, { rs: string; rf: string }> = {
  memory:    { rs: "rgb(208,50,60)",  rf: "rgba(208,50,60,0.58)" },
  emotion:   { rs: "rgb(60,168,80)",  rf: "rgba(60,168,80,0.6)" },
  attention: { rs: "rgb(115,130,65)", rf: "rgba(150,165,90,0.4)" },
  language:  { rs: "rgb(145,80,110)", rf: "rgba(180,110,140,0.42)" },
  face:      { rs: "rgb(165,130,60)", rf: "rgba(195,160,85,0.32)" },
  reward:    { rs: "rgb(50,70,180)",  rf: "rgba(50,70,180,0.75)" },
};

export function BrainAtlas({
  size = 200,
  activeKeys = [],
  intensity,
  pulseKey = null,
  showAll = false,
  showBadges = true,
  showLabelImage = true,
}: Props) {
  const height = Math.round((size * VIEW_H) / VIEW_W);

  const regionOpacity = (key: RegionKey): number => {
    if (pulseKey === key) return 1;
    if (showAll) return intensity?.[key] != null ? Math.min(1, intensity[key]! * 4) : 1;
    if (activeKeys.includes(key)) return 1;
    return 0.18;
  };

  const regionStyle = (key: RegionKey): CSSProperties => {
    const { rs, rf } = REGIONS[key];
    const isPulse = pulseKey === key;
    return {
      // Custom CSS vars consumed by the embedded styles below.
      ["--rs" as string]: rs,
      ["--rf" as string]: rf,
      opacity: regionOpacity(key),
      transition: "opacity 380ms ease",
      transformBox: "fill-box",
      transformOrigin: "center",
      animation: isPulse ? "cortyzePulse 2s ease-in-out infinite" : undefined,
    } as CSSProperties;
  };

  return (
    <svg
      width={size}
      height={height}
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Cortyze six-region brain atlas"
      style={{ display: "block" }}
    >
      <defs>
        <style>{`
          .ba-region.surface path,
          .ba-region.surface ellipse {
            fill: var(--rf);
            stroke: var(--rs);
            stroke-width: 1.6;
            stroke-linejoin: round;
          }
          .ba-region.deep ellipse.ba-shape {
            fill: var(--rf);
            stroke: var(--rs);
            stroke-width: 1.4;
            stroke-dasharray: 3 2.4;
          }
          .ba-region.deep.anatomical path.ba-shape,
          .ba-region.deep.anatomical circle.ba-shape {
            fill: var(--rf);
            stroke: var(--rs);
            stroke-width: 1.7;
            stroke-linejoin: round;
          }
          .ba-region .ba-badge circle {
            fill: #f7f3ea;
            stroke: var(--rs);
            stroke-width: 1.6;
          }
          .ba-region .ba-badge text {
            font-family: "IBM Plex Mono", "JetBrains Mono", ui-monospace, "SF Mono", Menlo, Consolas, monospace;
            font-size: 11px;
            font-weight: 700;
            fill: var(--rs);
            text-anchor: middle;
            dominant-baseline: central;
          }
          .ba-region .ba-lead {
            stroke: var(--rs);
            stroke-width: 1;
            fill: none;
            stroke-dasharray: 2 2;
            opacity: .7;
          }
        `}</style>
      </defs>

      {showLabelImage && (
        <image
          href="/cortyze-brain.webp"
          x={0}
          y={0}
          width={VIEW_W}
          height={VIEW_H}
          style={{ filter: "saturate(.85) contrast(1.02)" }}
        />
      )}

      {/* 3. Attention */}
      <g className="ba-region surface" style={regionStyle("attention")}>
        <path d="M 170,530 Q 180,514 215,512 Q 232,510 250,512 Q 285,514 296,530 Q 300,548 285,556 Q 260,562 232,562 Q 204,562 180,556 Q 165,548 170,530 Z" />
        {showBadges && (
          <g className="ba-badge" transform="translate(232,536)">
            <circle r="11" />
            <text>3</text>
          </g>
        )}
      </g>

      {/* 4. Language */}
      <g className="ba-region surface" style={regionStyle("language")}>
        <path d="M 105,140 C 115,150 118,172 112,190 C 102,206 78,206 62,200 C 46,192 40,170 48,150 C 58,134 82,130 96,134 C 100,135 103,138 105,140 Z" />
        <path d="M 96,355 C 104,366 105,386 99,406 C 90,420 68,422 52,416 C 38,408 33,392 38,372 C 44,354 62,346 78,350 C 86,351 92,353 96,355 Z" />
        {showBadges && (
          <>
            <g className="ba-badge" transform="translate(78,168)">
              <circle r="11" />
              <text>4</text>
            </g>
            <g className="ba-badge" transform="translate(64,383)">
              <circle r="11" />
              <text>4</text>
            </g>
          </>
        )}
      </g>

      {/* 6. Reward */}
      <g className="ba-region deep anatomical" style={regionStyle("reward")}>
        <circle className="ba-shape" cx="232" cy="240" r="10" />
        <circle className="ba-shape" cx="232" cy="345" r="8" />
        {showBadges && (
          <>
            <g className="ba-badge" transform="translate(272,240)">
              <circle r="11" />
              <text>6</text>
            </g>
            <line className="ba-lead" x1="261" y1="240" x2="244" y2="240" />
          </>
        )}
      </g>

      {/* 2. Emotion */}
      <g className="ba-region deep anatomical" style={regionStyle("emotion")}>
        <path className="ba-shape" d="M 196,270 C 196,264 205,260 215,263 C 223,266 226,273 223,280 C 219,286 207,285 199,282 C 194,279 195,274 196,270 Z" />
        <path className="ba-shape" d="M 268,270 C 268,264 259,260 249,263 C 241,266 238,273 241,280 C 245,286 257,285 265,282 C 270,279 269,274 268,270 Z" />
        {showBadges && (
          <>
            <g className="ba-badge" transform="translate(163,272)">
              <circle r="11" />
              <text>2</text>
            </g>
            <line className="ba-lead" x1="174" y1="272" x2="192" y2="272" />
            <g className="ba-badge" transform="translate(301,272)">
              <circle r="11" />
              <text>2</text>
            </g>
            <line className="ba-lead" x1="290" y1="272" x2="272" y2="272" />
          </>
        )}
      </g>

      {/* 1. Memory */}
      <g className="ba-region deep anatomical" style={regionStyle("memory")}>
        <path className="ba-shape" d="M 210,288 C 196,290 181,298 175,314 C 168,332 166,354 173,370 C 181,384 196,390 206,384 C 215,378 215,365 211,352 C 208,338 205,325 207,312 C 209,300 217,292 217,288 C 215,286 212,286 210,288 Z" />
        <path className="ba-shape" d="M 254,288 C 268,290 283,298 289,314 C 296,332 298,354 291,370 C 283,384 268,390 258,384 C 249,378 249,365 253,352 C 256,338 259,325 257,312 C 255,300 247,292 247,288 C 249,286 252,286 254,288 Z" />
        {showBadges && (
          <>
            <g className="ba-badge" transform="translate(133,338)">
              <circle r="11" />
              <text>1</text>
            </g>
            <line className="ba-lead" x1="144" y1="338" x2="166" y2="338" />
            <g className="ba-badge" transform="translate(331,338)">
              <circle r="11" />
              <text>1</text>
            </g>
            <line className="ba-lead" x1="320" y1="338" x2="298" y2="338" />
          </>
        )}
      </g>

      {/* 5. Face */}
      <g className="ba-region deep" style={regionStyle("face")}>
        <ellipse className="ba-shape" cx="172" cy="425" rx="20" ry="11" />
        <ellipse className="ba-shape" cx="292" cy="425" rx="20" ry="11" />
        {showBadges && (
          <>
            <g className="ba-badge" transform="translate(126,425)">
              <circle r="11" />
              <text>5</text>
            </g>
            <line className="ba-lead" x1="137" y1="425" x2="152" y2="425" />
            <g className="ba-badge" transform="translate(338,425)">
              <circle r="11" />
              <text>5</text>
            </g>
            <line className="ba-lead" x1="327" y1="425" x2="312" y2="425" />
          </>
        )}
      </g>
    </svg>
  );
}

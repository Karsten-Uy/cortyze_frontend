"use client";

/**
 * Per-region time-series mini chart. Each value is the score [0, 100] for
 * one second of the input. Bars rise from the 50-baseline:
 *  - amber when score < 40 (dip territory)
 *  - emerald when score > 70 (peak territory)
 *  - neutral grey otherwise
 */
export function Sparkline({
  values,
  width = 320,
  height = 28,
}: {
  values: number[];
  width?: number;
  height?: number;
}) {
  if (!values || values.length === 0) return null;

  const baseline = height / 2;
  const barWidth = width / values.length;

  return (
    <svg
      width="100%"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className="block"
      aria-label="Per-second score time series"
    >
      <line
        x1={0}
        y1={baseline}
        x2={width}
        y2={baseline}
        stroke="rgb(64, 64, 64)"
        strokeWidth={0.5}
        strokeDasharray="2 2"
      />
      {values.map((v, i) => {
        const clamped = Math.max(0, Math.min(100, v));
        const distFromMid = Math.abs(clamped - 50);
        const barHeight = (distFromMid / 50) * baseline;
        const isHigh = clamped > 50;
        const color =
          clamped < 40
            ? "rgb(252, 191, 73)"
            : clamped > 70
              ? "rgb(110, 231, 183)"
              : "rgb(115, 115, 115)";
        return (
          <rect
            key={i}
            x={i * barWidth + 0.25}
            y={isHigh ? baseline - barHeight : baseline}
            width={Math.max(0.5, barWidth - 0.5)}
            height={barHeight || 0.5}
            fill={color}
          />
        );
      })}
    </svg>
  );
}

"use client";

import { bandSoftClass, scoreBand, scoreLabel } from "@/lib/score";

/**
 * Speedometer-style dial matching the Neurons reference. A 180° arc
 * sweeps from red (left) through amber to green (right). A needle points
 * at the current score; a status pill ("Optimize" / "Strong" / etc.) and
 * the numeric score render to the left.
 *
 * Pure SVG, no external deps. Sized via CSS — pass `size` to control the
 * intrinsic viewBox.
 */
export function ScoreDial({
  score,
  goalLabel,
  size = 220,
}: {
  score: number;
  goalLabel: string;
  size?: number;
}) {
  const clamped = Math.max(0, Math.min(100, score));
  const band = scoreBand(clamped);
  const label = scoreLabel(clamped);

  // Arc geometry
  const cx = size / 2;
  const cy = size * 0.7;
  const r = size * 0.42;
  const stroke = size * 0.1;

  // Arc from 180° to 360° (left to right, top half)
  const startAngle = Math.PI;
  const endAngle = 2 * Math.PI;
  const totalAngle = endAngle - startAngle;
  const scoreAngle = startAngle + (clamped / 100) * totalAngle;

  function arcPath(a0: number, a1: number): string {
    const x0 = cx + r * Math.cos(a0);
    const y0 = cy + r * Math.sin(a0);
    const x1 = cx + r * Math.cos(a1);
    const y1 = cy + r * Math.sin(a1);
    const large = a1 - a0 > Math.PI ? 1 : 0;
    return `M ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1}`;
  }

  // Three colored segments: poor (0-40), warn (40-70), good (70-100)
  const a40 = startAngle + 0.4 * totalAngle;
  const a70 = startAngle + 0.7 * totalAngle;

  // Needle — short pointer ending just inside the arc.
  const needleLen = r - stroke / 2 - 4;
  const nx = cx + needleLen * Math.cos(scoreAngle);
  const ny = cy + needleLen * Math.sin(scoreAngle);

  return (
    <div className="flex flex-col">
      <div className="text-xs font-medium uppercase tracking-wider text-foreground-subtle">
        Cortyze impact score
      </div>
      <div className="mt-1 flex items-center gap-4">
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-semibold tabular-nums text-foreground">
              {clamped.toFixed(1)}
            </span>
            <span className="text-sm text-foreground-subtle">/ 100</span>
          </div>
          <div className="mt-2 inline-flex">
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-medium ${bandSoftClass(band)}`}
            >
              {label}
            </span>
          </div>
          <div className="mt-2 text-xs text-foreground-subtle">
            Weighted by{" "}
            <span className="font-medium text-foreground">{goalLabel}</span>
          </div>
        </div>
        <svg
          width={size}
          height={size * 0.75}
          viewBox={`0 0 ${size} ${size * 0.78}`}
          aria-label={`Score ${clamped.toFixed(1)} of 100, ${label}`}
        >
          {/* track */}
          <path
            d={arcPath(startAngle, endAngle)}
            fill="none"
            stroke="var(--border)"
            strokeWidth={stroke}
            strokeLinecap="round"
          />
          {/* poor segment 0-40 */}
          <path
            d={arcPath(startAngle, a40)}
            fill="none"
            stroke="var(--poor)"
            strokeWidth={stroke}
            strokeLinecap="round"
            opacity={0.85}
          />
          {/* warn segment 40-70 */}
          <path
            d={arcPath(a40, a70)}
            fill="none"
            stroke="var(--warn)"
            strokeWidth={stroke}
            strokeLinecap="butt"
            opacity={0.85}
          />
          {/* good segment 70-100 */}
          <path
            d={arcPath(a70, endAngle)}
            fill="none"
            stroke="var(--good)"
            strokeWidth={stroke}
            strokeLinecap="round"
            opacity={0.85}
          />
          {/* needle */}
          <line
            x1={cx}
            y1={cy}
            x2={nx}
            y2={ny}
            stroke="var(--foreground)"
            strokeWidth={3}
            strokeLinecap="round"
          />
          <circle cx={cx} cy={cy} r={5} fill="var(--foreground)" />
        </svg>
      </div>
    </div>
  );
}

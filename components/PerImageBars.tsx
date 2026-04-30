"use client";

/**
 * Per-image score chart for galleries. Replaces the time-series Sparkline
 * when viewing a carousel — the X axis is "image 1, 2, ..., N" instead of
 * seconds. Each bar height encodes the average score for that image; the
 * color scheme matches Sparkline (amber dip / grey neutral / emerald peak).
 *
 * Optional `thumbnails` renders each image's own strip below its bar so
 * the user can read the bars directly against the content.
 */
export function PerImageBars({
  values,
  thumbnails,
  width = 320,
  barAreaHeight = 36,
  thumbHeight = 28,
  activeIndex,
  onSelect,
}: {
  values: number[];
  thumbnails?: string[];
  width?: number;
  barAreaHeight?: number;
  thumbHeight?: number;
  activeIndex?: number;
  onSelect?: (index: number) => void;
}) {
  if (!values || values.length === 0) return null;

  const n = values.length;
  // 4-px gap between bars, evenly distributed.
  const gap = 4;
  const slotWidth = (width - gap * (n - 1)) / n;
  const baseline = barAreaHeight / 2;

  function colorFor(clamped: number): string {
    if (clamped < 40) return "rgb(252, 191, 73)";
    if (clamped > 70) return "rgb(110, 231, 183)";
    return "rgb(115, 115, 115)";
  }

  return (
    <div className="block">
      <svg
        width="100%"
        viewBox={`0 0 ${width} ${barAreaHeight}`}
        preserveAspectRatio="none"
        className="block"
        aria-label="Per-image score chart"
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
          const color = colorFor(clamped);
          const x = i * (slotWidth + gap);
          return (
            <rect
              key={i}
              x={x}
              y={isHigh ? baseline - barHeight : baseline}
              width={Math.max(1, slotWidth)}
              height={barHeight || 0.5}
              fill={color}
              opacity={
                activeIndex === undefined || activeIndex === i ? 1 : 0.5
              }
            />
          );
        })}
      </svg>
      {thumbnails && thumbnails.length === n && (
        <div
          className="mt-1 grid"
          style={{
            gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))`,
            gap: `${gap}px`,
          }}
        >
          {thumbnails.map((src, i) => {
            const active = activeIndex === i;
            return onSelect ? (
              <button
                key={i}
                type="button"
                onClick={() => onSelect(i)}
                className={`overflow-hidden rounded-sm transition ${
                  active ? "ring-2 ring-emerald-500" : "opacity-60 hover:opacity-100"
                }`}
                style={{ height: thumbHeight }}
                aria-label={`Image ${i + 1}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </button>
            ) : (
              <div
                key={i}
                className={`overflow-hidden rounded-sm ${
                  active ? "ring-2 ring-emerald-500" : "opacity-60"
                }`}
                style={{ height: thumbHeight }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </div>
            );
          })}
        </div>
      )}
      <div
        className="mt-0.5 grid font-mono text-[10px] text-neutral-600"
        style={{
          gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))`,
          gap: `${gap}px`,
        }}
      >
        {values.map((_, i) => (
          <span key={i} className="text-center">
            {i + 1}
          </span>
        ))}
      </div>
    </div>
  );
}

/**
 * Bin a per-second region timeseries into per-image averages.
 *
 * The GPU worker's gallery flow holds each image for `secondsPerImage`
 * seconds when synthesizing the video, so the timeseries length
 * approximately equals `imageCount * secondsPerImage`. Edge cases:
 *  - Length mismatch (off-by-one rounding from the encoder): the last
 *    bin absorbs any leftover samples, the first N-1 bins are uniform.
 *  - Length << expected: missing bins fall back to the overall mean.
 */
export function binTimeseriesByImages(
  values: number[],
  imageCount: number,
  secondsPerImage: number,
): number[] {
  if (imageCount <= 0 || values.length === 0) return [];
  // Use proportional binning rather than raw secondsPerImage — the
  // worker's actual T may differ slightly from the predicted total.
  const samplesPerImage = values.length / imageCount;
  const out: number[] = [];
  for (let i = 0; i < imageCount; i++) {
    const start = Math.floor(i * samplesPerImage);
    // Last bin grabs everything to the end so we never drop trailing samples.
    const end =
      i === imageCount - 1
        ? values.length
        : Math.floor((i + 1) * samplesPerImage);
    const slice = values.slice(start, Math.max(start + 1, end));
    if (slice.length === 0) {
      // Fallback if the math goes weird (e.g. T < imageCount).
      const overall =
        values.reduce((a, b) => a + b, 0) / values.length;
      out.push(overall);
      continue;
    }
    const avg = slice.reduce((a, b) => a + b, 0) / slice.length;
    out.push(avg);
  }
  // We're not using secondsPerImage in the actual binning (proportional
  // is more robust to encoder rounding), but it's part of the public
  // signature to make the call site self-documenting.
  void secondsPerImage;
  return out;
}

/**
 * Convert a time-based moment window into a 1-indexed image range using
 * the gallery's per-image hold time. Returns the inclusive [start, end]
 * image indices. Used to relabel dip/peak chips for galleries.
 */
export function momentToImageRange(
  startSeconds: number,
  endSeconds: number,
  secondsPerImage: number,
  imageCount: number,
): { startImage: number; endImage: number } {
  if (secondsPerImage <= 0 || imageCount <= 0) {
    return { startImage: 1, endImage: 1 };
  }
  const startImage = Math.min(
    imageCount,
    Math.max(1, Math.floor(startSeconds / secondsPerImage) + 1),
  );
  const endImage = Math.min(
    imageCount,
    Math.max(startImage, Math.ceil(endSeconds / secondsPerImage)),
  );
  return { startImage, endImage };
}

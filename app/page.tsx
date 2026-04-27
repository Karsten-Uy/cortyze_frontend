"use client";

import { useEffect, useRef, useState } from "react";
import { Dropzone } from "@/components/Dropzone";
import { Sparkline } from "@/components/Sparkline";
import {
  analyze,
  API_URL,
  formatTimestamp,
  GOAL_WEIGHTS,
  GOALS,
  Goal,
  REGION_INSIGHTS,
  REGION_KEYS,
  REGION_LABELS,
  RegionKey,
  uploadFile,
  type BrainReport,
  type Moment,
  type Suggestion,
} from "@/lib/api";
import { compressVideo } from "@/lib/compress";
import {
  COMPRESS_TARGET_BYTES,
  COMPRESS_THRESHOLD_BYTES,
  HARD_LIMIT_BYTES,
  formatBytes,
} from "@/lib/limits";

const SAMPLE_URL =
  "https://download.blender.org/durian/trailer/sintel_trailer-480p.mp4";

const GOAL_LABELS: Record<Goal, string> = {
  conversion: "Conversion",
  awareness: "Awareness",
  engagement: "Engagement",
  brand_recall: "Brand Recall",
};

type Mode = "url" | "upload";

export default function Page() {
  const [mode, setMode] = useState<Mode>("upload");
  const [contentUrl, setContentUrl] = useState(SAMPLE_URL);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [originalSize, setOriginalSize] = useState<number | null>(null);
  const [goal, setGoal] = useState<Goal>("engagement");
  const [report, setReport] = useState<BrainReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [compressing, setCompressing] = useState(false);
  const [compressProgress, setCompressProgress] = useState(0);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);

  // Resolve a playable video URL: blob: for uploaded files, the raw URL
  // for paste-URL mode. Revokes blob URLs on cleanup so submitting twice
  // doesn't leak memory.
  useEffect(() => {
    if (mode === "url") {
      setVideoSrc(contentUrl || null);
      return;
    }
    if (pendingFile) {
      const url = URL.createObjectURL(pendingFile);
      setVideoSrc(url);
      return () => URL.revokeObjectURL(url);
    }
    setVideoSrc(null);
  }, [mode, contentUrl, pendingFile]);

  function acceptFile(file: File) {
    setPendingFile(file);
    setOriginalSize(file.size);
    setError(null);
    setReport(null);
  }

  async function onCompress() {
    if (!pendingFile) return;
    setCompressing(true);
    setCompressProgress(0);
    setError(null);
    try {
      const compressed = await compressVideo(pendingFile, (frac) =>
        setCompressProgress(frac),
      );
      setPendingFile(compressed);
    } catch (e) {
      setError(
        `Compression failed: ${e instanceof Error ? e.message : String(e)}. ` +
          "You can still try uploading the original.",
      );
    } finally {
      setCompressing(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setReport(null);
    try {
      let url = contentUrl;
      if (mode === "upload") {
        if (!pendingFile) {
          throw new Error("Drop a file first");
        }
        setStage("Uploading...");
        url = await uploadFile(pendingFile);
      }
      setStage("Scanning brain...");
      const r = await analyze({
        content_url: url,
        content_type: "video",
        goal,
      });
      setReport(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
      setStage("");
    }
  }

  const fileTooLarge = pendingFile ? pendingFile.size > HARD_LIMIT_BYTES : false;
  const shouldOfferCompress =
    pendingFile && pendingFile.size >= COMPRESS_THRESHOLD_BYTES && !fileTooLarge;
  const wasCompressed =
    pendingFile && originalSize !== null && pendingFile.size < originalSize;

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100">
      <div className="mx-auto max-w-4xl px-6 py-16">
        <header className="mb-10">
          <h1 className="text-4xl font-bold tracking-tight">BrainScore</h1>
          <p className="mt-2 text-neutral-400">
            Brain-scan content before you post it. Backend:{" "}
            <code className="rounded bg-neutral-800 px-1.5 py-0.5 text-xs">
              {API_URL}
            </code>
          </p>
        </header>

        <form onSubmit={onSubmit} className="space-y-6">
          <div>
            <div className="mb-3 flex gap-2 text-sm">
              <button
                type="button"
                onClick={() => setMode("upload")}
                className={`rounded-md px-3 py-1.5 transition ${
                  mode === "upload"
                    ? "bg-neutral-800 text-neutral-100"
                    : "text-neutral-500 hover:text-neutral-300"
                }`}
              >
                Upload file
              </button>
              <button
                type="button"
                onClick={() => setMode("url")}
                className={`rounded-md px-3 py-1.5 transition ${
                  mode === "url"
                    ? "bg-neutral-800 text-neutral-100"
                    : "text-neutral-500 hover:text-neutral-300"
                }`}
              >
                Paste URL
              </button>
            </div>

            {mode === "upload" ? (
              <div>
                <Dropzone
                  onFile={acceptFile}
                  onError={(msg) => setError(msg)}
                  disabled={loading || compressing}
                  maxBytes={HARD_LIMIT_BYTES}
                />
                {pendingFile && (
                  <FilePreview
                    file={pendingFile}
                    originalSize={originalSize}
                    wasCompressed={!!wasCompressed}
                    shouldOfferCompress={!!shouldOfferCompress}
                    compressing={compressing}
                    compressProgress={compressProgress}
                    onCompress={onCompress}
                    onClear={() => {
                      setPendingFile(null);
                      setOriginalSize(null);
                    }}
                  />
                )}
              </div>
            ) : (
              <input
                type="url"
                required
                value={contentUrl}
                onChange={(e) => setContentUrl(e.target.value)}
                className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-3 font-mono text-sm focus:border-neutral-600 focus:outline-none"
              />
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-neutral-300">
              Goal
            </label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {GOALS.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGoal(g)}
                  className={`rounded-lg border px-3 py-2 text-sm transition ${
                    goal === g
                      ? "border-emerald-500 bg-emerald-500/10 text-emerald-300"
                      : "border-neutral-800 bg-neutral-900 text-neutral-300 hover:border-neutral-600"
                  }`}
                >
                  {GOAL_LABELS[g]}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={
              loading || compressing || (mode === "upload" && !pendingFile)
            }
            className="w-full rounded-lg bg-emerald-600 px-4 py-3 font-medium text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? stage || "Working..." : "Run BrainScore"}
          </button>
        </form>

        {error && (
          <div className="mt-6 rounded-lg border border-red-900 bg-red-950/50 p-4 text-sm text-red-300">
            <p className="font-medium">Heads up</p>
            <p className="mt-1 font-mono text-xs">{error}</p>
          </div>
        )}

        {report && <Report report={report} videoSrc={videoSrc} />}
      </div>
    </main>
  );
}

function FilePreview({
  file,
  originalSize,
  wasCompressed,
  shouldOfferCompress,
  compressing,
  compressProgress,
  onCompress,
  onClear,
}: {
  file: File;
  originalSize: number | null;
  wasCompressed: boolean;
  shouldOfferCompress: boolean;
  compressing: boolean;
  compressProgress: number;
  onCompress: () => void;
  onClear: () => void;
}) {
  return (
    <div className="mt-3 rounded-lg border border-neutral-800 bg-neutral-900 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-mono text-sm text-neutral-200">
            {file.name}
          </p>
          <p className="text-xs text-neutral-500">
            {formatBytes(file.size)}
            {wasCompressed && originalSize !== null && (
              <span className="ml-2 text-emerald-400">
                · compressed from {formatBytes(originalSize)}
              </span>
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={onClear}
          className="rounded-md px-2 py-1 text-xs text-neutral-500 hover:text-neutral-300"
          disabled={compressing}
        >
          Clear
        </button>
      </div>

      {compressing && (
        <div className="mt-3">
          <div className="mb-1 flex justify-between text-xs text-neutral-400">
            <span>Compressing in your browser…</span>
            <span>{Math.round(compressProgress * 100)}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-neutral-800">
            <div
              className="h-full bg-emerald-500 transition-[width] duration-200"
              style={{ width: `${compressProgress * 100}%` }}
            />
          </div>
        </div>
      )}

      {!compressing && shouldOfferCompress && (
        <div className="mt-3 rounded border border-amber-900/60 bg-amber-950/20 p-3 text-xs text-amber-200">
          <p className="font-medium text-amber-100">Large file detected</p>
          <p className="mt-1 text-amber-300/80">
            This will upload faster (and stay inside the R2 free tier) if
            compressed. Re-encoded to ~{formatBytes(COMPRESS_TARGET_BYTES)} at
            720p / 24 fps. Runs in your browser, ~30 sec.
          </p>
          <button
            type="button"
            onClick={onCompress}
            className="mt-2 rounded-md bg-amber-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-amber-500"
          >
            Compress before uploading
          </button>
        </div>
      )}
    </div>
  );
}

function topRegions(scores: Record<RegionKey, number>, n = 3): Set<RegionKey> {
  return new Set(
    (Object.entries(scores) as [RegionKey, number][])
      .sort((a, b) => b[1] - a[1])
      .slice(0, n)
      .map(([k]) => k),
  );
}

function Report({
  report,
  videoSrc,
}: {
  report: BrainReport;
  videoSrc: string | null;
}) {
  const top = topRegions(report.region_scores, 3);
  const goal = report.goal as Goal;
  const goalLabel = GOAL_LABELS[goal];
  const videoRef = useRef<HTMLVideoElement>(null);

  const seekTo = videoSrc
    ? (seconds: number) => {
        const v = videoRef.current;
        if (!v) return;
        v.currentTime = seconds;
        v.play().catch(() => {
          /* user hasn't interacted yet, browser may block autoplay */
        });
        v.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    : undefined;

  return (
    <section className="mt-12 space-y-6">
      <div className="flex items-baseline justify-between border-b border-neutral-800 pb-4">
        <h2 className="text-2xl font-semibold">Brain Report</h2>
        <span className="text-xs text-neutral-500">
          {report.elapsed_ms} ms · {report.model_version}
        </span>
      </div>

      {videoSrc && (
        <div className="overflow-hidden rounded-2xl border border-neutral-800 bg-black">
          <video
            ref={videoRef}
            src={videoSrc}
            controls
            preload="metadata"
            className="w-full"
          />
          <p className="border-t border-neutral-900 px-4 py-2 text-xs text-neutral-500">
            Your content. Click any dip or peak chip below to jump to that
            moment.
          </p>
        </div>
      )}

      {report.brain_image_b64 && (
        <div className="overflow-hidden rounded-2xl border border-neutral-800 bg-[#0a0a0a]">
          <img
            src={`data:image/png;base64,${report.brain_image_b64}`}
            alt="Cortical activation map"
            className="w-full"
          />
          <p className="border-t border-neutral-900 px-4 py-2 text-xs text-neutral-500">
            Predicted cortical activation, time-averaged. Bright = stronger
            response. Left and right hemispheres, lateral view.
          </p>
        </div>
      )}

      <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-8">
        <p className="text-sm uppercase tracking-wide text-neutral-400">
          Overall ({goalLabel})
        </p>
        <p className="mt-2 text-6xl font-bold text-emerald-400">
          {report.overall_score.toFixed(1)}
        </p>
        <p className="mt-3 text-xs text-neutral-500">
          Weighted sum of the 8 region scores below, using the {goalLabel}{" "}
          column from the goal-weight table. Different goal → same regions,
          different overall.
        </p>
      </div>

      <div className="space-y-2">
        <p className="px-1 text-xs uppercase tracking-wide text-neutral-500">
          By region — what each measures, and how much it matters for{" "}
          {goalLabel}
        </p>
        {REGION_KEYS.map((k: RegionKey) => {
          const score = report.region_scores[k];
          const weight = GOAL_WEIGHTS[goal][k];
          const insight = REGION_INSIGHTS[k];
          const isTop = top.has(k);
          const aboveAverage = score >= 50;
          const series = report.region_timeseries?.[k] ?? null;
          const regionMoments = report.moments.filter((m) => m.region === k);
          const regionSuggestions = report.suggestions.filter(
            (s) => s.region === k,
          );
          const totalSeconds = series ? series.length : 0;
          return (
            <div
              key={k}
              className={`rounded-lg p-4 transition ${
                isTop
                  ? "border border-emerald-900/60 bg-emerald-950/20"
                  : "bg-neutral-900"
              }`}
            >
              <div className="mb-1 flex items-baseline justify-between gap-3">
                <span
                  className={`text-sm font-medium ${
                    isTop ? "text-emerald-200" : "text-neutral-200"
                  }`}
                >
                  {REGION_LABELS[k]}
                  {isTop && (
                    <span className="ml-2 text-xs font-normal text-emerald-500">
                      top {top.size}
                    </span>
                  )}
                </span>
                <span className="font-mono text-sm tabular-nums text-neutral-300">
                  {score.toFixed(1)}
                </span>
              </div>

              <p className="mb-2 text-xs text-neutral-500">
                {insight.short}
                <span className="mx-1.5 text-neutral-700">·</span>
                <span className="text-neutral-400">
                  {(weight * 100).toFixed(0)}% of {goalLabel}
                </span>
              </p>

              {series && series.length > 1 && (
                <div className="mb-2">
                  <Sparkline values={series} />
                  <div className="mt-0.5 flex justify-between font-mono text-[10px] text-neutral-600">
                    <span>0:00</span>
                    <span>{formatTimestamp(totalSeconds)}</span>
                  </div>
                </div>
              )}

              <div className="h-2 overflow-hidden rounded-full bg-neutral-800">
                <div
                  className={isTop ? "h-full bg-emerald-400" : "h-full bg-emerald-500/60"}
                  style={{ width: `${score}%` }}
                />
              </div>

              {regionSuggestions.length > 0 && (
                <div className="mt-3 space-y-2">
                  {regionSuggestions.map((s, i) => (
                    <SuggestionCard key={i} suggestion={s} onSeek={seekTo} />
                  ))}
                </div>
              )}

              {regionMoments.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {regionMoments.map((m, i) => (
                    <MomentChip key={i} moment={m} onSeek={seekTo} />
                  ))}
                </div>
              )}

              <details className="mt-2 text-xs">
                <summary className="cursor-pointer text-neutral-500 hover:text-neutral-300">
                  What does this score mean?
                </summary>
                <div className="mt-2 space-y-1.5 text-neutral-400">
                  <p>{insight.full}</p>
                  <p
                    className={
                      aboveAverage
                        ? "text-emerald-300"
                        : "text-neutral-400"
                    }
                  >
                    <span className="font-medium">
                      {aboveAverage ? "Your score (above 50):" : "If high:"}
                    </span>{" "}
                    {insight.high}
                  </p>
                  <p
                    className={
                      aboveAverage ? "text-neutral-400" : "text-amber-300"
                    }
                  >
                    <span className="font-medium">
                      {aboveAverage ? "If low:" : "Your score (below 50):"}
                    </span>{" "}
                    {insight.low}
                  </p>
                </div>
              </details>
            </div>
          );
        })}
      </div>

      {report.suggestions.length > 0 && (
        <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4 text-xs text-neutral-500">
          <p>
            <span className="font-medium text-neutral-300">
              {report.suggestions.length} suggestion
              {report.suggestions.length === 1 ? "" : "s"}
            </span>{" "}
            generated, prioritized by {goalLabel} weighting. Click any chip's{" "}
            <code className="rounded bg-neutral-800 px-1">▶ Jump to</code>{" "}
            button to seek the video to that moment.
          </p>
        </div>
      )}

      {report.suggestions.length === 0 && report.moments.length > 0 && (
        <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4 text-xs text-neutral-500">
          <p>
            No suggestions fired — every region scored above the 50 threshold
            for the {goalLabel} goal, or weights were too low. {""}
            {report.moments.filter((m) => m.type === "dip").length} dips and{" "}
            {report.moments.filter((m) => m.type === "peak").length} peaks
            detected; click any chip to see what happened at that moment.
          </p>
        </div>
      )}

      <details className="rounded-lg border border-neutral-800 bg-neutral-900 p-4 text-xs">
        <summary className="cursor-pointer text-neutral-400">Raw JSON</summary>
        <pre className="mt-3 overflow-x-auto font-mono text-neutral-300">
          {JSON.stringify(
            {
              ...report,
              brain_image_b64: report.brain_image_b64 ? "<base64 PNG>" : null,
              region_timeseries: report.region_timeseries
                ? `<8 series of ${
                    Object.values(report.region_timeseries)[0]?.length ?? 0
                  } values>`
                : null,
            },
            null,
            2,
          )}
        </pre>
      </details>
    </section>
  );
}

const PRIORITY_BORDER: Record<Suggestion["priority"], string> = {
  critical: "border-red-900/60 bg-red-950/30",
  important: "border-amber-900/60 bg-amber-950/20",
  minor: "border-neutral-700 bg-neutral-900",
};

const PRIORITY_DOT: Record<Suggestion["priority"], string> = {
  critical: "bg-red-500",
  important: "bg-amber-500",
  minor: "bg-neutral-500",
};

const PRIORITY_BUTTON: Record<Suggestion["priority"], string> = {
  critical: "bg-red-900/50 text-red-100 hover:bg-red-800/60",
  important: "bg-amber-900/50 text-amber-100 hover:bg-amber-800/60",
  minor: "bg-neutral-800 text-neutral-200 hover:bg-neutral-700",
};

function SuggestionCard({
  suggestion,
  onSeek,
}: {
  suggestion: Suggestion;
  onSeek?: (seconds: number) => void;
}) {
  return (
    <div
      className={`rounded-md border p-3 text-xs ${PRIORITY_BORDER[suggestion.priority]}`}
    >
      <div className="mb-1.5 flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-neutral-400">
        <span
          className={`h-1.5 w-1.5 rounded-full ${PRIORITY_DOT[suggestion.priority]}`}
        />
        {suggestion.priority}
      </div>
      <p className="text-sm font-medium text-neutral-100">{suggestion.title}</p>
      <p className="mt-1.5 leading-relaxed text-neutral-300">{suggestion.fix}</p>
      {suggestion.why && (
        <p className="mt-1.5 italic leading-relaxed text-neutral-500">
          {suggestion.why}
        </p>
      )}
      {onSeek && suggestion.timestamp_start_s != null && (
        <button
          type="button"
          onClick={() => onSeek(suggestion.timestamp_start_s!)}
          className={`mt-2 rounded-sm px-2 py-1 text-[10px] font-medium uppercase tracking-wide transition ${PRIORITY_BUTTON[suggestion.priority]}`}
        >
          ▶ Jump to {formatTimestamp(suggestion.timestamp_start_s)}
        </button>
      )}
    </div>
  );
}

function MomentChip({
  moment,
  onSeek,
}: {
  moment: Moment;
  onSeek?: (seconds: number) => void;
}) {
  const isDip = moment.type === "dip";
  const wordEvents = moment.events.filter((e) => e.type === "Word" && e.text);
  return (
    <details
      className={`group rounded-md border px-2 py-1 text-[11px] ${
        isDip
          ? "border-amber-900/60 bg-amber-950/30 text-amber-300"
          : "border-emerald-900/60 bg-emerald-950/30 text-emerald-300"
      }`}
    >
      <summary className="cursor-pointer list-none font-mono">
        <span className="mr-1 uppercase tracking-wide">
          {isDip ? "dip" : "peak"}
        </span>
        {formatTimestamp(moment.start_s)}–{formatTimestamp(moment.end_s)}
        <span className="ml-1.5 opacity-70">avg {moment.avg_score.toFixed(0)}</span>
      </summary>
      <div className="mt-1.5 space-y-1.5 text-neutral-400">
        <p className="text-neutral-500">{moment.context}</p>
        {wordEvents.length > 0 && (
          <p className="font-mono text-[10px] text-neutral-600">
            words at this moment:{" "}
            {wordEvents.map((e) => `"${e.text}"`).join(", ")}
          </p>
        )}
        {onSeek && (
          <button
            type="button"
            onClick={() => onSeek(moment.start_s)}
            className={`mt-1 rounded-sm px-2 py-1 text-[10px] font-medium uppercase tracking-wide transition ${
              isDip
                ? "bg-amber-900/50 text-amber-100 hover:bg-amber-800/60"
                : "bg-emerald-900/50 text-emerald-100 hover:bg-emerald-800/60"
            }`}
          >
            ▶ Jump to {formatTimestamp(moment.start_s)}
          </button>
        )}
      </div>
    </details>
  );
}

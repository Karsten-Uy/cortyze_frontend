"use client";

import { useState } from "react";
import {
  analyze,
  API_URL,
  GOALS,
  Goal,
  REGION_KEYS,
  REGION_LABELS,
  RegionKey,
  type BrainReport,
} from "@/lib/api";

const SAMPLE_URL =
  "https://download.blender.org/durian/trailer/sintel_trailer-480p.mp4";

const GOAL_LABELS: Record<Goal, string> = {
  conversion: "Conversion",
  awareness: "Awareness",
  engagement: "Engagement",
  brand_recall: "Brand Recall",
};

export default function Page() {
  const [contentUrl, setContentUrl] = useState(SAMPLE_URL);
  const [goal, setGoal] = useState<Goal>("engagement");
  const [report, setReport] = useState<BrainReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setReport(null);
    try {
      const r = await analyze({
        content_url: contentUrl,
        content_type: "video",
        goal,
      });
      setReport(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100">
      <div className="mx-auto max-w-3xl px-6 py-16">
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
            <label className="mb-2 block text-sm font-medium text-neutral-300">
              Content URL
            </label>
            <input
              type="url"
              required
              value={contentUrl}
              onChange={(e) => setContentUrl(e.target.value)}
              className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-3 font-mono text-sm focus:border-neutral-600 focus:outline-none"
            />
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
            disabled={loading}
            className="w-full rounded-lg bg-emerald-600 px-4 py-3 font-medium text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Scanning..." : "Run BrainScore"}
          </button>
        </form>

        {error && (
          <div className="mt-6 rounded-lg border border-red-900 bg-red-950/50 p-4 text-sm text-red-300">
            <p className="font-medium">Request failed</p>
            <p className="mt-1 font-mono text-xs">{error}</p>
            <p className="mt-2 text-red-400/70">
              Make sure the backend is running:{" "}
              <code className="rounded bg-red-950 px-1">
                uv run uvicorn api.main:app --reload
              </code>
            </p>
          </div>
        )}

        {report && <Report report={report} />}
      </div>
    </main>
  );
}

function Report({ report }: { report: BrainReport }) {
  return (
    <section className="mt-12 space-y-6">
      <div className="flex items-baseline justify-between border-b border-neutral-800 pb-4">
        <h2 className="text-2xl font-semibold">Brain Report</h2>
        <span className="text-xs text-neutral-500">
          {report.elapsed_ms} ms · {report.model_version}
        </span>
      </div>

      <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-8">
        <p className="text-sm uppercase tracking-wide text-neutral-400">
          Overall ({report.goal.replace("_", " ")})
        </p>
        <p className="mt-2 text-6xl font-bold text-emerald-400">
          {report.overall_score.toFixed(1)}
        </p>
      </div>

      <div className="space-y-2">
        {REGION_KEYS.map((k: RegionKey) => {
          const score = report.region_scores[k];
          return (
            <div key={k} className="rounded-lg bg-neutral-900 p-4">
              <div className="mb-2 flex items-baseline justify-between">
                <span className="text-sm font-medium text-neutral-200">
                  {REGION_LABELS[k]}
                </span>
                <span className="font-mono text-sm tabular-nums text-neutral-300">
                  {score.toFixed(1)}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-neutral-800">
                <div
                  className="h-full bg-emerald-500"
                  style={{ width: `${score}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <details className="rounded-lg border border-neutral-800 bg-neutral-900 p-4 text-xs">
        <summary className="cursor-pointer text-neutral-400">Raw JSON</summary>
        <pre className="mt-3 overflow-x-auto font-mono text-neutral-300">
          {JSON.stringify(report, null, 2)}
        </pre>
      </details>
    </section>
  );
}

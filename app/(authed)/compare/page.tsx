"use client";

import { useEffect, useState } from "react";

import { ReportView } from "@/components/ReportView";
import {
  type ComparisonResult,
  type RegionKey,
  type ReportSummary,
  REGION_LABELS,
  compareReports,
  listReports,
} from "@/lib/api";
import { bandSoftClass, scoreBand } from "@/lib/score";

/**
 * Side-by-side comparison of two existing runs. Two run-pickers at the
 * top, then on submit we render:
 *
 *   - Headline: "B wins by 7.2 points" (color-coded)
 *   - Per-region delta strip (which side wins each region by how much)
 *   - LLM-generated narrative explaining why
 *   - Both ReportViews stacked / side-by-side for direct comparison
 */
export default function ComparePage() {
  const [runs, setRuns] = useState<ReportSummary[]>([]);
  const [a, setA] = useState<string>("");
  const [b, setB] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ComparisonResult | null>(null);

  useEffect(() => {
    listReports({ limit: 200 })
      .then((r) => setRuns(r.items))
      .catch((e) => setError(e instanceof Error ? e.message : String(e)));
  }, []);

  async function handleCompare(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!a || !b) {
      setError("Pick two runs to compare.");
      return;
    }
    if (a === b) {
      setError("Pick two different runs.");
      return;
    }
    setBusy(true);
    try {
      const res = await compareReports(a, b);
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Compare runs</h1>
        <p className="mt-1 text-sm text-foreground-muted">
          Pick two of your past runs and see which scores higher overall, where
          the gap is widest, and why.
        </p>
      </header>

      <form
        onSubmit={handleCompare}
        className="card grid items-end gap-3 p-4 sm:grid-cols-3"
      >
        <RunPicker label="Run A" runs={runs} value={a} onChange={setA} />
        <RunPicker label="Run B" runs={runs} value={b} onChange={setB} />
        <button
          type="submit"
          disabled={busy}
          className="rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground transition hover:bg-accent-hover disabled:opacity-50"
        >
          {busy ? "Comparing…" : "Compare"}
        </button>
      </form>

      {error && (
        <div className="rounded-lg border border-poor/30 bg-poor-soft px-3 py-2 text-sm text-poor">
          {error}
        </div>
      )}

      {result && <ComparisonView result={result} />}
    </div>
  );
}

function RunPicker({
  label,
  runs,
  value,
  onChange,
}: {
  label: string;
  runs: ReportSummary[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="block w-full rounded-md border border-border bg-surface px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-soft"
      >
        <option value="">Select a run…</option>
        {runs.map((r) => (
          <option key={r.request_id} value={r.request_id}>
            {(r.title ?? `${r.goal} · ${r.content_type}`) +
              ` · ${Math.round(r.overall_score)}`}
          </option>
        ))}
      </select>
    </label>
  );
}

function ComparisonView({ result }: { result: ComparisonResult }) {
  const winnerLabel =
    result.winner === "tie"
      ? "Roughly tied"
      : result.winner === "a"
        ? "Run A wins"
        : "Run B wins";

  return (
    <div className="space-y-6">
      {/* Verdict header */}
      <div className="card flex flex-col gap-2 p-5">
        <div className="flex flex-wrap items-baseline gap-3">
          <span className="text-xl font-semibold">{winnerLabel}</span>
          <span
            className={`rounded-full px-2 py-0.5 text-xs ${bandSoftClass(
              scoreBand(50 + Math.abs(result.overall_delta)),
            )}`}
          >
            {result.overall_delta > 0 ? "+" : ""}
            {result.overall_delta.toFixed(1)} overall
          </span>
        </div>
        <p className="text-sm leading-relaxed text-foreground-muted whitespace-pre-line">
          {result.llm_summary}
        </p>
      </div>

      {/* Per-region delta */}
      <div className="card p-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground-subtle">
          Per-region delta (Run B − Run A)
        </h2>
        <ul className="mt-3 space-y-1.5">
          {Object.entries(result.per_region_delta)
            .sort(([, a], [, b]) => Math.abs(b) - Math.abs(a))
            .map(([region, delta]) => (
              <DeltaRow key={region} region={region as RegionKey} delta={delta} />
            ))}
        </ul>
      </div>

      {/* Stacked reports */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-foreground-subtle">
            Run A · {result.report_a.title ?? result.report_a.request_id.slice(0, 8)}
          </h2>
          <ReportView report={result.report_a} />
        </div>
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-foreground-subtle">
            Run B · {result.report_b.title ?? result.report_b.request_id.slice(0, 8)}
          </h2>
          <ReportView report={result.report_b} />
        </div>
      </div>
    </div>
  );
}

function DeltaRow({ region, delta }: { region: RegionKey; delta: number }) {
  const max = 30; // ±30 fills the bar
  const pct = Math.min(1, Math.abs(delta) / max);
  return (
    <li className="grid grid-cols-[140px_1fr_60px] items-center gap-3 text-sm">
      <span className="truncate text-foreground-muted">
        {REGION_LABELS[region] ?? region}
      </span>
      <div className="relative h-2 rounded-full bg-surface-muted">
        <div className="absolute left-1/2 h-full w-px bg-border" />
        <div
          className={`absolute top-0 h-full rounded-full ${
            delta >= 0 ? "left-1/2 bg-good" : "right-1/2 bg-poor"
          }`}
          style={{ width: `${(pct * 50).toFixed(2)}%` }}
        />
      </div>
      <span
        className={`text-right tabular-nums ${
          delta > 0 ? "text-good" : delta < 0 ? "text-poor" : "text-foreground-subtle"
        }`}
      >
        {delta > 0 ? "+" : ""}
        {delta.toFixed(1)}
      </span>
    </li>
  );
}

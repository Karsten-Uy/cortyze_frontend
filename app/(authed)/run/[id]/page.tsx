"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";

import { ReportView } from "@/components/ReportView";
import { type BrainReport, getReport } from "@/lib/api";

/**
 * Past-run view. Fetches the BrainReport by id and renders it in the
 * same component used for fresh runs. Accessible from the sidebar.
 *
 * Next 16 passes route params as a Promise. We unwrap with `use()`.
 */
export default function RunPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [report, setReport] = useState<BrainReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
    setReport(null);
    getReport(id)
      .then(setReport)
      .catch((e) => setError(e instanceof Error ? e.message : String(e)));
  }, [id]);

  if (error) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-poor/30 bg-poor-soft px-4 py-3 text-sm text-poor">
          {error}
        </div>
        <Link
          href="/"
          className="text-sm text-accent hover:text-accent-hover"
        >
          ← Back to analyze
        </Link>
      </div>
    );
  }

  if (!report) {
    return (
      <p className="text-sm text-foreground-subtle">Loading run {id}…</p>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex items-baseline justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {report.title ?? `Run ${id.slice(0, 8)}`}
          </h1>
          <p className="mt-1 text-xs text-foreground-subtle">
            {report.created_at && new Date(report.created_at).toLocaleString()}{" "}
            · {report.model_version}
          </p>
        </div>
        <Link
          href="/"
          className="text-sm text-accent hover:text-accent-hover"
        >
          New run →
        </Link>
      </header>
      <ReportView report={report} />
    </div>
  );
}

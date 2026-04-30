"use client";

import { useEffect, useRef, useState } from "react";

import { ReportView } from "@/components/ReportView";
import { UploadPanel } from "@/components/UploadPanel";
import type { BrainReport } from "@/lib/api";

/**
 * The main authenticated route. Two modes:
 *   - pre-run: UploadPanel shown full-bleed, no report yet
 *   - post-run: report scrolled into view; upload still mounted above
 *     (per spec) so the user can scroll up and re-upload without
 *     navigating away.
 */
export default function AnalyzePage() {
  const [report, setReport] = useState<BrainReport | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);
  const uploadRef = useRef<HTMLDivElement>(null);

  // After a run completes, scroll the report into view smoothly.
  useEffect(() => {
    if (report && reportRef.current) {
      reportRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [report]);

  function handleScrollToUpload() {
    uploadRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="space-y-10">
      {/* Header */}
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Analyze</h1>
        <p className="mt-1 text-sm text-foreground-muted">
          Upload a video or post and get a per-region brain-response forecast,
          plus actionable suggestions.
        </p>
      </header>

      {/* Upload — always mounted */}
      <section ref={uploadRef}>
        <UploadPanel onComplete={(r) => setReport(r)} />
      </section>

      {/* Report — only after a run */}
      {report && (
        <section ref={reportRef} className="space-y-4">
          <div className="flex items-baseline justify-between">
            <h2 className="text-2xl font-semibold tracking-tight">
              Brain Report
            </h2>
            <span className="text-xs text-foreground-subtle">
              {report.elapsed_ms} ms · {report.model_version}
            </span>
          </div>
          <ReportView report={report} />

          <div className="flex justify-center pt-6">
            <button
              type="button"
              onClick={handleScrollToUpload}
              className="rounded-lg border border-border bg-surface px-4 py-2 text-sm text-foreground-muted hover:border-border-strong hover:text-foreground"
            >
              ↑ Scroll up to run another
            </button>
          </div>
        </section>
      )}
    </div>
  );
}

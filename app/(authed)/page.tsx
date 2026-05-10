"use client";

import { useState } from "react";
import { usePostHog } from "posthog-js/react";

import { AnalysisAnimation } from "@/components/AnalysisAnimation";
import { Compare } from "@/components/Compare";
import {
  LabBench,
  type LabBenchInitialValues,
  type LabBenchInput,
  type MediaFile,
} from "@/components/LabBench";
import { NavBar } from "@/components/NavBar";
import { Results } from "@/components/Results";
import {
  ApiError,
  createRun,
  getRun,
  type SuggestionPlan,
} from "@/lib/api";

type View = "bench" | "analyzing" | "results" | "compare";

export default function CortyzePage() {
  const posthog = usePostHog();
  const [view, setView] = useState<View>("bench");
  const [currentRunId, setCurrentRunId] = useState<string | null>(null);
  const [currentPlan, setCurrentPlan] = useState<SuggestionPlan | null>(null);
  // Source clip URL for the active run — fed to the Results screen's
  // hero video player. Demo runs persist `media_url` from the demo
  // JSON; real uploads round-trip the R2 presigned URL via /runs/:id.
  const [currentMediaUrl, setCurrentMediaUrl] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  // Pre-fills the LabBench form when the user clicks "Edit & re-score"
  // on the Results view. Cleared after a successful submit so the next
  // visit to the bench from a fresh entry point starts blank.
  const [benchInitialValues, setBenchInitialValues] =
    useState<LabBenchInitialValues | null>(null);

  async function handleRun(input: LabBenchInput) {
    setSubmitError(null);
    try {
      const kind: "Video" | "Image" =
        input.media?.kind === "Image" ? "Image" : "Video";
      const { run_id } = await createRun({
        name: input.name,
        goal: input.goal,
        brief: input.brief,
        caption: input.caption,
        media_url: input.media?.url ?? null,
        media_object_key: input.media?.objectKey ?? null,
        kind,
        demo_id: input.demoId ?? null,
      });
      setCurrentRunId(run_id);
      // Drop any "Edit & re-score" pre-fill now that a new run has
      // been kicked off — next visit to the bench starts blank.
      setBenchInitialValues(null);
      posthog?.capture("demo_run_started", {
        run_id,
        goal: input.goal,
        kind,
        has_brief: Boolean(input.brief),
        is_demo: Boolean(input.demoId),
      });
      setView("analyzing");
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Failed to start run";
      setSubmitError(msg);
    }
  }

  function handleAnalysisComplete(plan: SuggestionPlan) {
    setCurrentPlan(plan);
    posthog?.capture("demo_run_completed", { run_id: currentRunId });
    setView("results");
    // Best-effort: pull the run record so the hero video player on
    // Results has its `media_url`. Failure is fine — Results just
    // hides the hero when mediaUrl is null.
    if (currentRunId) {
      getRun(currentRunId)
        .then((record) => setCurrentMediaUrl(record.media_url))
        .catch((err) => {
          console.warn("could not fetch media_url for hero player:", err);
          setCurrentMediaUrl(null);
        });
    }
  }

  function handleAnalysisFailed(message: string) {
    setSubmitError(message);
    setView("bench");
  }

  async function handleEdit() {
    // Fetch the run BEFORE switching views so LabBench mounts with the
    // correct initialValues on first render — useState initializers
    // don't re-run when props change later, so a post-mount update
    // would leave the form blank until the user types.
    if (currentRunId) {
      try {
        const record = await getRun(currentRunId);
        // Reuse the same R2 object on resubmit (no re-upload) when
        // both the URL and the stable key are present. The clip lives
        // 7 days under the bucket lifecycle rule; if it's been
        // garbage-collected, /runs/:id returns media_url=null and the
        // user falls back to the dropzone naturally.
        const reusedMedia: MediaFile | null =
          record.media_url && record.media_object_key
            ? {
                name: `Reused from "${record.name}"`,
                kind: record.kind,
                size: "—",
                url: record.media_url,
                objectKey: record.media_object_key,
              }
            : null;
        setBenchInitialValues({
          name: record.name,
          goal: record.goal,
          brief: record.brief ?? "",
          caption: record.caption ?? "",
          media: reusedMedia,
          demoId: record.demo_id ?? null,
        });
      } catch (err) {
        // Pre-fill is best-effort; bench will just be blank on failure.
        console.warn("Edit & re-score pre-fill failed:", err);
        setBenchInitialValues(null);
      }
    } else {
      setBenchInitialValues(null);
    }
    setView("bench");
  }

  function handleNavSelect(tab: "bench" | "results" | "compare") {
    setView(tab);
    if (tab === "bench") {
      // Going to Lab bench via the nav (vs. via Edit & re-score) means
      // the user wants a blank slate for a brand-new run.
      setBenchInitialValues(null);
    }
  }

  const navTab: "bench" | "results" | "compare" =
    view === "compare" ? "compare" : view === "bench" ? "bench" : "results";

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <NavBar active={navTab} onSelect={handleNavSelect} />

      <main
        style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {view === "bench" && (
          <LabBench
            onRun={handleRun}
            initialError={submitError}
            initialValues={benchInitialValues}
          />
        )}
        {view === "analyzing" && currentRunId && (
          <AnalysisAnimation
            runId={currentRunId}
            onComplete={handleAnalysisComplete}
            onFailed={handleAnalysisFailed}
          />
        )}
        {view === "results" && currentPlan && (
          <Results
            plan={currentPlan}
            mediaUrl={currentMediaUrl}
            onEdit={handleEdit}
          />
        )}
        {view === "results" && !currentPlan && (
          <EmptyResultsHint onEdit={handleEdit} />
        )}
        {view === "compare" && <Compare />}
      </main>
    </div>
  );
}

function EmptyResultsHint({ onEdit }: { onEdit: () => void }) {
  return (
    <div
      style={{
        flex: 1,
        display: "grid",
        placeItems: "center",
        padding: 32,
        textAlign: "center",
      }}
    >
      <div style={{ maxWidth: 320 }}>
        <div
          className="serif"
          style={{ fontSize: 22, color: "var(--ink)", marginBottom: 6 }}
        >
          No results yet
        </div>
        <div style={{ fontSize: 13, color: "var(--ink-3)", marginBottom: 18 }}>
          Run an analysis from the Lab bench to see results here.
        </div>
        <button
          onClick={onEdit}
          style={{
            background: "var(--coral)",
            color: "#fff",
            border: "none",
            borderRadius: 12,
            padding: "10px 20px",
            fontSize: 13,
            fontWeight: 500,
          }}
        >
          Open Lab bench
        </button>
      </div>
    </div>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { AnalysisAnimation } from "@/components/AnalysisAnimation";
import { AppSidebar } from "@/components/AppSidebar";
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
  getMe,
  getRun,
  listRuns,
  signOut,
  type PastRun,
  type Profile,
  type SuggestionPlan,
} from "@/lib/api";

type View = "bench" | "analyzing" | "results";

export default function CortyzePage() {
  const router = useRouter();
  const [view, setView] = useState<View>("bench");
  const [pastRuns, setPastRuns] = useState<PastRun[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [currentRunId, setCurrentRunId] = useState<string | null>(null);
  const [currentPlan, setCurrentPlan] = useState<SuggestionPlan | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  // Drives the mobile-only drawer behavior — desktop sidebar ignores this.
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  // Desktop collapse/expand state. Lifted here so Lab-bench / Results
  // clicks (and past-run selection) can auto-collapse alongside.
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  // Pre-fills the LabBench form when the user clicks "Edit & re-score"
  // on the Results view. Cleared after a successful submit so the next
  // visit to the bench from a fresh entry point starts blank.
  const [benchInitialValues, setBenchInitialValues] =
    useState<LabBenchInitialValues | null>(null);

  const refreshPastRuns = useCallback(async () => {
    try {
      const runs = await listRuns(20);
      setPastRuns(runs);
    } catch (err) {
      // Don't blow up the page if the sidebar fetch fails; surface
      // through console + leave list empty. Bench / analyzing views
      // still work.
      console.error("Failed to load past runs:", err);
    }
  }, []);

  // Initial sidebar + profile fetch on mount. Modeled as external-
  // system subscriptions per the React 19 effects guidance: the .then
  // callback is the "callback when external state changes" form the
  // lint rule expects, vs. calling setState synchronously in the
  // effect body.
  useEffect(() => {
    let cancelled = false;
    listRuns(20)
      .then((runs) => {
        if (!cancelled) setPastRuns(runs);
      })
      .catch((err) => {
        console.error("Failed to load past runs:", err);
      });
    getMe()
      .then((p) => {
        if (!cancelled) setProfile(p);
      })
      .catch((err) => {
        // 401 here means the backend requires a JWT we don't have —
        // expected when AUTH_DISABLED is off but Supabase isn't
        // configured client-side. NavBar falls back gracefully.
        console.warn("Failed to load profile:", err);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSignOut() {
    await signOut();
    setProfile(null);
    router.replace("/login");
  }

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
      });
      setCurrentRunId(run_id);
      // Drop any "Edit & re-score" pre-fill now that a new run has
      // been kicked off — next visit to the bench starts blank.
      setBenchInitialValues(null);
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
    setView("results");
    // Refresh sidebar so the new run appears.
    void refreshPastRuns();
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

  function handleNavSelect(tab: "bench" | "results") {
    setView(tab);
    // Only collapse the sidebar on Lab bench. Results keeps it open so
    // the user can keep browsing past runs without re-opening it.
    if (tab === "bench") {
      setMobileSidebarOpen(false);
      setSidebarExpanded(false);
      // Going to Lab bench via the nav (vs. via Edit & re-score) means
      // the user wants a blank slate for a brand-new run.
      setBenchInitialValues(null);
    }
  }

  // Loading the full run record happens lazily on click — sidebar PastRun
  // entries don't carry the SuggestionPlan, only the score/date/kind.
  async function handleSelectPastRun(runId: string) {
    setCurrentRunId(runId);
    setSubmitError(null);
    // Sidebar stays open intentionally — user only closes via the
    // hamburger or by navigating to Lab bench.
    try {
      const record = await getRun(runId);
      if (record.status === "failed") {
        setSubmitError(record.error ?? "Run failed");
        setView("bench");
        return;
      }
      if (record.result) {
        setCurrentPlan(record.result);
        setView("results");
      } else {
        // Still in flight — fall back to the analyzing view, which will
        // poll until completion via AnalysisAnimation's waitForRun.
        setView("analyzing");
      }
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Failed to load run";
      setSubmitError(msg);
    }
  }

  const navTab: "bench" | "results" = view === "bench" ? "bench" : "results";

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <NavBar
        active={navTab}
        onSelect={handleNavSelect}
        profile={profile}
        onSignOut={handleSignOut}
        onOpenSidebar={() => setMobileSidebarOpen(true)}
      />

      <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
        <AppSidebar
          runs={pastRuns}
          currentId={currentRunId}
          onSelect={handleSelectPastRun}
          expanded={sidebarExpanded}
          onExpandedChange={setSidebarExpanded}
          mobileOpen={mobileSidebarOpen}
          onMobileClose={() => setMobileSidebarOpen(false)}
        />
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
            <Results plan={currentPlan} onEdit={handleEdit} />
          )}
          {view === "results" && !currentPlan && (
            <EmptyResultsHint onEdit={handleEdit} />
          )}
        </main>
      </div>
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

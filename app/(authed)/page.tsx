"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { AnalysisAnimation } from "@/components/AnalysisAnimation";
import { AppSidebar } from "@/components/AppSidebar";
import { LabBench, type LabBenchInput } from "@/components/LabBench";
import { NavBar } from "@/components/NavBar";
import { Results } from "@/components/Results";
import {
  ApiError,
  createRun,
  getMe,
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
      const { run_id } = await createRun({
        name: input.name,
        goal: input.goal,
        brief: input.brief,
        caption: input.caption,
        media_url: input.media?.url ?? null,
        kind: input.media?.kind === "Image" ? "Image" : "Video",
      });
      setCurrentRunId(run_id);
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

  function handleEdit() {
    setView("bench");
  }

  function handleNavSelect(tab: "bench" | "results") {
    setView(tab);
  }

  const navTab: "bench" | "results" = view === "bench" ? "bench" : "results";

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <NavBar
        active={navTab}
        onSelect={handleNavSelect}
        profile={profile}
        onSignOut={handleSignOut}
      />

      <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
        <AppSidebar
          runs={pastRuns}
          currentId={currentRunId}
          onSelect={(id) => setCurrentRunId(id)}
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
            <LabBench onRun={handleRun} initialError={submitError} />
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

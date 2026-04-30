"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import {
  GOALS,
  GOAL_WEIGHTS,
  type BrainReport,
  type Goal,
  type RegionKey,
  regoalReport,
} from "@/lib/api";
import { MetricGrid } from "./MetricGrid";
import { ScoreDial } from "./ScoreDial";
import { SuggestionsList } from "./SuggestionsList";

const GOAL_LABEL: Record<Goal, string> = {
  conversion: "Conversion",
  awareness: "Awareness",
  engagement: "Engagement",
  brand_recall: "Brand Recall",
};

/**
 * Composite report view, Neurons-style. Two layers of goal-switching:
 *
 *   - **Free, instant**: clicking a different goal in the GoalSwitcher
 *     re-displays cached `region_scores` under the new weights — UI-only,
 *     no backend call. ScoreDial + MetricGrid update immediately.
 *
 *   - **Cheap, opt-in**: the "Regenerate suggestions for {goal}" button
 *     calls /reports/{id}/regoal on the backend — one Claude call,
 *     creates a new report row, navigates to it.
 *
 * The original suggestions stay anchored to the goal that generated
 * them (`report.goal`); a banner appears when the active lens differs.
 */
export function ReportView({ report }: { report: BrainReport }) {
  const router = useRouter();
  const [activeRegion, setActiveRegion] = useState<RegionKey | null>(null);
  const [activeGoal, setActiveGoal] = useState<Goal>(report.goal);
  const [regoalBusy, setRegoalBusy] = useState(false);
  const [regoalError, setRegoalError] = useState<string | null>(null);

  // Active overall: prefer cached, fall back to live re-weighting if the
  // report is from before overall_by_goal was added.
  const overallForActive = useMemo(() => {
    if (report.overall_by_goal && report.overall_by_goal[activeGoal] != null) {
      return report.overall_by_goal[activeGoal];
    }
    if (activeGoal === report.goal) return report.overall_score;
    const weights = GOAL_WEIGHTS[activeGoal];
    let acc = 0;
    for (const [region, score] of Object.entries(report.region_scores)) {
      acc += (weights[region as RegionKey] ?? 0) * (score as number);
    }
    return acc;
  }, [report, activeGoal]);

  const goalDiverged = activeGoal !== report.goal;

  async function handleRegenerate() {
    setRegoalError(null);
    setRegoalBusy(true);
    try {
      const newReport = await regoalReport(report.request_id, activeGoal);
      router.push(`/run/${newReport.request_id}`);
      router.refresh();
    } catch (e) {
      setRegoalError(e instanceof Error ? e.message : String(e));
      setRegoalBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Optional caption / context strip */}
      {(report.caption_text || report.additional_context) && (
        <div className="card flex flex-col gap-2 px-5 py-4">
          {report.caption_text && (
            <div>
              <div className="text-xs font-medium uppercase tracking-wider text-foreground-subtle">
                Caption
              </div>
              <p className="mt-1 text-sm text-foreground">{report.caption_text}</p>
            </div>
          )}
          {report.additional_context && (
            <div>
              <div className="text-xs font-medium uppercase tracking-wider text-foreground-subtle">
                Brand / campaign context
              </div>
              <p className="mt-1 text-sm text-foreground-muted italic">
                {report.additional_context}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Goal switcher — free, instant */}
      <GoalSwitcher
        active={activeGoal}
        onChange={setActiveGoal}
        original={report.goal}
        overallByGoal={report.overall_by_goal}
      />

      {/* Hero: brain heatmap left, score dial right */}
      <div className="grid gap-6 lg:grid-cols-2">
        <BrainImagePanel
          imageUri={report.brain_image_uri}
          imageB64={report.brain_image_b64}
          contentType={report.content_type}
        />
        <div className="card flex flex-col justify-between p-6">
          <ScoreDial score={overallForActive} goalLabel={GOAL_LABEL[activeGoal]} />
          <p className="mt-4 text-xs text-foreground-subtle">
            Weighted sum of the 8 region scores below. Switching the goal
            re-weights the same regions in your browser — no backend call.
            Suggestions stay anchored to the goal that generated them.
          </p>
        </div>
      </div>

      {/* Region grid */}
      <section>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground-subtle">
            By region — what each measures, and how much it matters for{" "}
            {GOAL_LABEL[activeGoal]}
          </h2>
          {activeRegion && (
            <button
              type="button"
              onClick={() => setActiveRegion(null)}
              className="text-xs text-accent hover:text-accent-hover"
            >
              Clear filter
            </button>
          )}
        </div>
        <MetricGrid
          scores={report.region_scores}
          goal={activeGoal}
          activeRegion={activeRegion}
          onSelectRegion={(r) =>
            setActiveRegion((cur) => (cur === r ? null : r))
          }
        />
      </section>

      {/* Goal-divergence banner — only if user is viewing under a non-original goal */}
      {goalDiverged && (
        <div className="card flex flex-col gap-3 border-warn/30 bg-warn-soft/40 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-foreground">
            <span className="font-medium">
              Showing scores under {GOAL_LABEL[activeGoal]},
            </span>{" "}
            but the suggestions below were generated for{" "}
            <span className="font-medium">{GOAL_LABEL[report.goal]}</span>.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setActiveGoal(report.goal)}
              className="rounded-md border border-border bg-surface px-3 py-1.5 text-xs text-foreground-muted hover:text-foreground"
            >
              Revert to {GOAL_LABEL[report.goal]}
            </button>
            <button
              type="button"
              onClick={handleRegenerate}
              disabled={regoalBusy}
              className="rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground hover:bg-accent-hover disabled:opacity-50"
            >
              {regoalBusy
                ? "Regenerating…"
                : `Regenerate for ${GOAL_LABEL[activeGoal]}`}
            </button>
          </div>
        </div>
      )}
      {regoalError && (
        <div className="rounded-lg border border-poor/30 bg-poor-soft px-3 py-2 text-sm text-poor">
          {regoalError}
        </div>
      )}

      {/* Suggestions */}
      <section>
        <div className="mb-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground-subtle">
            Suggestions{" "}
            <span className="text-foreground-subtle">
              · {report.suggestions.length} generated, prioritized by{" "}
              {GOAL_LABEL[report.goal]}
            </span>
          </h2>
          <p className="mt-1 text-xs text-foreground-subtle">
            Click any suggestion to expand and see a reference example from
            content that scored well in that region.
          </p>
        </div>
        <SuggestionsList
          suggestions={report.suggestions}
          highlightRegion={activeRegion}
        />
      </section>
    </div>
  );
}

function GoalSwitcher({
  active,
  onChange,
  original,
  overallByGoal,
}: {
  active: Goal;
  onChange: (g: Goal) => void;
  original: Goal;
  overallByGoal: Record<Goal, number> | null;
}) {
  return (
    <div className="card flex flex-wrap items-center gap-2 p-2">
      <span className="px-2 text-xs font-medium uppercase tracking-wider text-foreground-subtle">
        Goal lens
      </span>
      <div className="flex flex-1 flex-wrap gap-1">
        {GOALS.map((g) => {
          const isActive = active === g;
          const isOriginal = original === g;
          const cached = overallByGoal?.[g];
          return (
            <button
              key={g}
              type="button"
              onClick={() => onChange(g)}
              className={`flex flex-col items-start rounded-md px-3 py-1.5 text-left transition ${
                isActive
                  ? "bg-accent-soft text-accent"
                  : "text-foreground-muted hover:bg-surface-muted hover:text-foreground"
              }`}
            >
              <span className="flex items-center gap-1.5 text-xs font-medium">
                {GOAL_LABEL[g]}
                {isOriginal && (
                  <span className="rounded-full bg-foreground/10 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-foreground-subtle">
                    Original
                  </span>
                )}
              </span>
              {cached != null && (
                <span className="text-xs tabular-nums text-foreground-subtle">
                  {cached.toFixed(1)}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function BrainImagePanel({
  imageUri,
  imageB64,
  contentType,
}: {
  imageUri: string | null;
  imageB64: string | null;
  contentType: string;
}) {
  // Prefer the persisted R2 URL (works across runs + regoals + history).
  // Fall back to the inline b64 from a fresh /analyze response.
  const src = imageUri ?? (imageB64 ? `data:image/png;base64,${imageB64}` : null);
  return (
    <div className="card flex flex-col p-3">
      <div className="rounded-xl bg-foreground/95 p-3">
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt="Predicted cortical activation"
            className="block w-full rounded-lg"
            crossOrigin="anonymous"
          />
        ) : (
          <div className="flex aspect-[16/9] items-center justify-center text-xs text-foreground-subtle">
            Brain image unavailable
          </div>
        )}
      </div>
      <p className="mt-3 px-1 text-xs text-foreground-subtle">
        Predicted cortical activation, time-averaged. Bright = stronger
        response. Left and right hemispheres, lateral view.{" "}
        <span className="text-foreground-muted">({contentType})</span>
      </p>
    </div>
  );
}

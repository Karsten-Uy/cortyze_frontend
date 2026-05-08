"use client";

import { useEffect, useRef, useState } from "react";

import { Badge } from "@/components/Badge";
import { BrainAtlas } from "@/components/BrainAtlas";
import { waitForRun, type SuggestionPlan } from "@/lib/api";
import { type RegionKey, type Tone } from "@/lib/cortyze-data";

const ORDER: RegionKey[] = ["memory", "emotion", "attention", "language", "face", "reward"];

const LABELS: Record<RegionKey, string> = {
  memory: "Scanning memory…",
  emotion: "Scanning emotion…",
  attention: "Scanning attention…",
  language: "Scanning language…",
  face: "Scanning face recognition…",
  reward: "Scanning reward…",
};

type Phase = "scanning" | "computing" | "reveal";

/**
 * AnalysisAnimation runs two things in parallel:
 *
 *  1. A fixed cosmetic scan animation (~3s of region-by-region pulse
 *     + a "Computing…" beat + a score reveal).
 *  2. A real fetch against `/runs/{id}` (via waitForRun) which polls
 *     until the backend pipeline reports `complete`.
 *
 * `onComplete(plan)` only fires once BOTH the animation has reached
 * its reveal phase AND the plan has arrived from the server. If the
 * server fails (or times out) we surface the error via `onFailed`.
 *
 * In mock mode the server completes in <100ms, so the animation
 * timing dominates. In real-TRIBE mode the server takes minutes —
 * that's a different UX problem; for now the animation just keeps
 * looping back to "Computing…" until the plan arrives.
 */
export function AnalysisAnimation({
  runId,
  onComplete,
  onFailed,
}: {
  runId: string;
  onComplete: (plan: SuggestionPlan) => void;
  onFailed: (message: string) => void;
}) {
  const [activeIdx, setActiveIdx] = useState(-1);
  const [phase, setPhase] = useState<Phase>("scanning");
  const [showBadge, setShowBadge] = useState(false);
  const [plan, setPlan] = useState<SuggestionPlan | null>(null);
  const onCompleteRef = useRef(onComplete);
  const onFailedRef = useRef(onFailed);

  // Latest-callback refs so the long-poll effect can call back without
  // re-subscribing on every render.
  useEffect(() => {
    onCompleteRef.current = onComplete;
    onFailedRef.current = onFailed;
  });

  // Cosmetic animation timeline — same beats as the original prototype.
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    ORDER.forEach((_, i) => {
      timers.push(setTimeout(() => setActiveIdx(i), i * 450 + 200));
    });
    timers.push(setTimeout(() => setPhase("computing"), ORDER.length * 450 + 400));
    timers.push(setTimeout(() => setPhase("reveal"), ORDER.length * 450 + 900));
    timers.push(setTimeout(() => setShowBadge(true), ORDER.length * 450 + 1200));
    return () => timers.forEach(clearTimeout);
  }, []);

  // Real fetch.
  useEffect(() => {
    let cancelled = false;
    waitForRun(runId)
      .then((p) => {
        if (!cancelled) setPlan(p);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : "Run failed";
        onFailedRef.current(msg);
      });
    return () => {
      cancelled = true;
    };
  }, [runId]);

  // Hand off to the page once both the animation reveal phase has
  // played AND the plan has arrived.
  useEffect(() => {
    if (phase === "reveal" && plan) {
      // Small delay so the badge gets a beat to show before the
      // results swap in. Matches the prototype's pacing.
      const t = setTimeout(() => onCompleteRef.current(plan), 1500);
      return () => clearTimeout(t);
    }
  }, [phase, plan]);

  const activeKeys = ORDER.slice(0, activeIdx + 1);

  const progress =
    phase === "reveal"
      ? 100
      : phase === "computing"
        ? 92
        : Math.max(0, ((activeIdx + 1) / ORDER.length) * 85);

  const status =
    phase === "computing"
      ? plan
        ? "Computing score…"
        : "Synthesising suggestions…"
      : phase === "reveal"
        ? null
        : activeIdx >= 0
          ? LABELS[ORDER[activeIdx]]
          : "Initialising…";

  // Reveal score uses the real plan if it's arrived, otherwise a
  // dash — the timeline guarantees we won't fire onComplete without
  // a plan, so this only flashes for at most one frame.
  const revealScore = plan ? Math.round(plan.score) : 0;
  const revealStatus = plan?.status ?? "Needs work";
  const revealTone: Tone = plan && plan.score >= 50 ? "green" : "coral";

  return (
    <div
      className="fade-in"
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 28,
        gap: 22,
      }}
    >
      {phase !== "reveal" ? (
        <>
          <BrainAtlas size={220} activeKeys={activeKeys} />
          <div style={{ minHeight: 22 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)" }}>
              {status}
            </div>
          </div>
          <div
            style={{
              width: 180,
              height: 3,
              background: "rgba(0,0,0,0.06)",
              borderRadius: 2,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${progress}%`,
                background: "var(--coral)",
                transition: "width 350ms ease",
              }}
            />
          </div>
          <div style={{ fontSize: 11, color: "var(--ink-3)" }}>
            Brain illustration:{" "}
            <a
              href="https://smart.servier.com/"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "inherit", textDecoration: "underline" }}
            >
              SMART by Servier
            </a>{" "}
            · CC BY 3.0
          </div>
        </>
      ) : (
        <div
          className="fade-in"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 14,
          }}
        >
          <div className="scale-in">
            <span
              className="mono"
              style={{
                fontSize: 48,
                fontWeight: 500,
                color: "var(--ink)",
                letterSpacing: "-0.02em",
              }}
            >
              {revealScore}
            </span>
            <span
              className="mono"
              style={{
                fontSize: 20,
                color: "var(--ink-4)",
                marginLeft: 4,
              }}
            >
              / 100
            </span>
          </div>
          {showBadge && (
            <Badge tone={revealTone} className="fade-up">
              {revealStatus}
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}

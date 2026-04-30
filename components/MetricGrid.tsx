"use client";

import {
  REGION_INSIGHTS,
  REGION_KEYS,
  REGION_LABELS,
  type Goal,
  type RegionKey,
} from "@/lib/api";
import { GOAL_WEIGHTS } from "@/lib/api";
import { bandBgClass, scoreBand } from "@/lib/score";

/**
 * Region-card grid matching the Neurons "metric pill" row at the bottom
 * of their report. Each pill = one of the 8 brain regions, ordered by
 * goal weight (most-important first) so the user reads the highest-
 * leverage cards first. The colored circle on the left mirrors the
 * status band (poor/warn/good) for at-a-glance scanning.
 *
 * Click a card to scroll to / focus the matching suggestion section
 * below — handler optional, render-only when omitted.
 */
export function MetricGrid({
  scores,
  goal,
  onSelectRegion,
  activeRegion,
}: {
  scores: Record<RegionKey, number>;
  goal: Goal;
  onSelectRegion?: (region: RegionKey) => void;
  activeRegion?: RegionKey | null;
}) {
  const weights = GOAL_WEIGHTS[goal];
  // Order: highest-weighted region first. Stable secondary sort by name
  // so equal-weight regions are reproducible.
  const ordered = [...REGION_KEYS].sort((a, b) => {
    const wd = weights[b] - weights[a];
    if (wd !== 0) return wd;
    return a.localeCompare(b);
  });

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {ordered.map((region) => {
        const score = scores[region] ?? 0;
        const band = scoreBand(score);
        const weight = Math.round((weights[region] ?? 0) * 100);
        const label = REGION_LABELS[region];
        const insight = REGION_INSIGHTS[region].short;
        const active = activeRegion === region;

        const Tag = onSelectRegion ? "button" : "div";

        return (
          <Tag
            key={region}
            type={onSelectRegion ? "button" : undefined}
            onClick={onSelectRegion ? () => onSelectRegion(region) : undefined}
            className={`card group flex w-full items-center gap-3 px-4 py-3 text-left transition ${
              onSelectRegion
                ? "cursor-pointer hover:border-border-strong hover:bg-surface-muted"
                : ""
            } ${active ? "ring-2 ring-accent ring-offset-2 ring-offset-background" : ""}`}
          >
            <span
              className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${bandBgClass(
                band,
              )} text-xs font-semibold text-white`}
            >
              {Math.round(score)}
            </span>
            <span className="flex flex-col">
              <span className="text-sm font-medium text-foreground">
                {label}
              </span>
              <span className="text-xs text-foreground-subtle line-clamp-2">
                {insight}
              </span>
              <span className="mt-0.5 text-[10px] uppercase tracking-wider text-foreground-subtle">
                {weight}% of {goal.replace("_", " ")}
              </span>
            </span>
          </Tag>
        );
      })}
    </div>
  );
}

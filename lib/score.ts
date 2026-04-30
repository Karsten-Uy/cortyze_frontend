// Shared score → color / status mappings for ScoreDial, MetricCard,
// SuggestionsList, etc. Single source of truth so the UI is consistent
// across regions, suggestions, and the overall dial.

export type ScoreBand = "poor" | "warn" | "good";

/** 0-100 score → traffic-light band. Boundaries chosen to match the
 *  Neurons reference: red <40, amber 40-70, green >70. */
export function scoreBand(score: number): ScoreBand {
  if (score < 40) return "poor";
  if (score >= 70) return "good";
  return "warn";
}

/** Headline label that appears next to the overall score in the dial. */
export function scoreLabel(score: number): string {
  const band = scoreBand(score);
  if (band === "good") return score >= 85 ? "Excellent" : "Strong";
  if (band === "warn") return "Optimize";
  return "Underperforming";
}

/** Tailwind background-color class for the colored chip / dot. */
export function bandBgClass(band: ScoreBand): string {
  return {
    poor: "bg-poor",
    warn: "bg-warn",
    good: "bg-good",
  }[band];
}

/** Tailwind text-color class. */
export function bandTextClass(band: ScoreBand): string {
  return {
    poor: "text-poor",
    warn: "text-warn",
    good: "text-good",
  }[band];
}

/** Tailwind softened-bg class for badges. */
export function bandSoftClass(band: ScoreBand): string {
  return {
    poor: "bg-poor-soft text-poor",
    warn: "bg-warn-soft text-warn",
    good: "bg-good-soft text-good",
  }[band];
}

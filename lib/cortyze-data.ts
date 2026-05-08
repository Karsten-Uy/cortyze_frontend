// Frontend-only Cortyze data: SVG geometry, UI copy, helpers.
//
// Run-specific data (region scores, suggestions, past runs) is fetched
// from the backend via `lib/api.ts`. Types are defined there too — this
// file imports + re-exports the ones consumed by components.

import type {
  ExampleAd,
  GoalKey,
  PastRun,
  Priority,
  RegionKey,
  RegionScore,
  Reference,
  Suggestion,
  SuggestionPlan,
} from "@/lib/api";

export type {
  ExampleAd,
  GoalKey,
  PastRun,
  Priority,
  RegionKey,
  RegionScore,
  Reference,
  Suggestion,
  SuggestionPlan,
};

export type Tone = "coral" | "green";

// ----------------------------------------------------------------------------
// Region SVG geometry — used by BrainSvg.
// ----------------------------------------------------------------------------

export type RegionMeta = {
  key: RegionKey;
  label: string;
  sci: string;
  role: string;
  pos: { cx: number; cy: number; rx: number; ry: number };
};

export const REGION_META: RegionMeta[] = [
  {
    key: "memory",
    label: "Memory",
    sci: "Hippocampus",
    role: "Memory encoding",
    pos: { cx: 100, cy: 115, rx: 22, ry: 14 },
  },
  {
    key: "emotion",
    label: "Emotion",
    sci: "Amygdala",
    role: "Emotional salience",
    pos: { cx: 72, cy: 105, rx: 16, ry: 12 },
  },
  {
    key: "attention",
    label: "Attention",
    sci: "Visual cortex",
    role: "Visual processing",
    pos: { cx: 100, cy: 145, rx: 28, ry: 12 },
  },
  {
    key: "language",
    label: "Language",
    sci: "Temporal lobe",
    role: "Language processing",
    pos: { cx: 132, cy: 90, rx: 18, ry: 14 },
  },
  {
    key: "face",
    label: "Face recognition",
    sci: "Fusiform face area",
    role: "Face detection",
    pos: { cx: 82, cy: 130, rx: 12, ry: 10 },
  },
  {
    key: "reward",
    label: "Reward",
    sci: "NAcc/VTA",
    role: "Reward & motivation",
    pos: { cx: 100, cy: 80, rx: 20, ry: 12 },
  },
];

// ----------------------------------------------------------------------------
// (i) tooltip text — shown next to each region in the BreakdownCard.
// ----------------------------------------------------------------------------

export const REGION_INFO: Record<RegionKey, string> = {
  memory:
    "How well your audience will remember your brand and message after seeing the ad. High memory scores mean fewer impressions needed to stick.",
  emotion:
    "How strongly your content triggers a gut reaction. High emotion drives sharing, saves, and word-of-mouth. People share what they feel.",
  attention:
    "How effectively your content grabs and holds the viewer's eye. Low attention means they scroll past before your message lands.",
  language:
    "How easily your audience processes your copy and captions. Simpler language means faster comprehension and more of your message gets absorbed.",
  face: "How well your content activates the brain's people-detection system. Faces build trust and connection. Ads with faces outperform faceless ads by 2-3x on engagement.",
  reward:
    'How much your content triggers the brain\'s "I want that" response. High reward scores predict click-through, add-to-cart, and purchase intent.',
};

// ----------------------------------------------------------------------------
// Goal options (display strings) + display↔key mapping.
// ----------------------------------------------------------------------------

export const GOAL_OPTIONS: { display: string; key: GoalKey }[] = [
  { display: "Brand recall",        key: "brand_recall" },
  { display: "Purchase intent",     key: "purchase_intent" },
  { display: "Emotional resonance", key: "emotional_resonance" },
  { display: "Trust",               key: "trust" },
  { display: "Attention",           key: "attention" },
];

// ----------------------------------------------------------------------------
// Helpers — pure UI logic, used by Results / Sidebar.
// ----------------------------------------------------------------------------

export function severity(score: number, benchmark: number) {
  const gap = benchmark - score;
  if (gap > 20) return { color: "var(--red)",   tint: "var(--red-tint)",   key: "red"   as const };
  if (gap > 10) return { color: "var(--amber)", tint: "var(--amber-tint)", key: "amber" as const };
  return                 { color: "var(--green)", tint: "var(--green-tint)", key: "green" as const };
}

export function priorityStyle(p: Priority) {
  if (p === "critical") return { bg: "var(--red-tint)",   fg: "var(--red)" };
  if (p === "high")     return { bg: "var(--amber-tint)", fg: "var(--amber)" };
  return                       { bg: "var(--green-tint)", fg: "var(--green)" };
}

// Deterministic delta-based comparison narrative.
//
// Used by the Compare page when no hand-written `ComparisonNarrative` is
// available from `GET /demos/comparison` (or whenever the comparison is
// over plans that don't have a canned narrative — e.g. a future
// "compare any 3 past runs" feature). Demo-mode today always overrides
// this with the canned copy from the backend; this exists so the UI
// doesn't have to special-case missing narrative.

import type {
  ComparisonNarrative,
  RegionKey,
  SuggestionPlan,
} from "@/lib/api";

export type ComparisonInput = {
  id: string;
  label: string;
  plan: SuggestionPlan;
};

const REGION_LABELS: Record<RegionKey, string> = {
  memory: "Memory",
  emotion: "Emotion",
  attention: "Attention",
  language: "Language",
  face: "Face",
  reward: "Reward",
};

const REGION_ORDER: RegionKey[] = [
  "memory",
  "emotion",
  "attention",
  "language",
  "face",
  "reward",
];

function scoreFor(plan: SuggestionPlan, key: RegionKey): number {
  const r = plan.regions.find((x) => x.key === key);
  return r ? r.score : 0;
}

export function buildFallbackNarrative(
  entries: ComparisonInput[],
): ComparisonNarrative {
  if (entries.length === 0) {
    return {
      headline: "No plans to compare",
      winner_demo_id: "",
      subhead: "",
      per_region_winners: {} as Record<RegionKey, string>,
      demo_takeaways: {},
    };
  }

  const sorted = [...entries].sort((a, b) => b.plan.score - a.plan.score);
  const winner = sorted[0];
  const runnerUp = sorted[1] ?? winner;
  const winnerLead = winner.plan.score - runnerUp.plan.score;

  // Region with the largest gap between winner and runner-up — anchors
  // the headline so the reader gets one concrete reason, not a vague
  // "wins on most things."
  let widestRegion: RegionKey = "memory";
  let widestGap = -Infinity;
  for (const key of REGION_ORDER) {
    const gap = scoreFor(winner.plan, key) - scoreFor(runnerUp.plan, key);
    if (gap > widestGap) {
      widestGap = gap;
      widestRegion = key;
    }
  }

  const perRegionWinners: Record<RegionKey, string> = {} as Record<
    RegionKey,
    string
  >;
  for (const key of REGION_ORDER) {
    let bestId = entries[0].id;
    let bestScore = -Infinity;
    for (const e of entries) {
      const s = scoreFor(e.plan, key);
      if (s > bestScore) {
        bestScore = s;
        bestId = e.id;
      }
    }
    perRegionWinners[key] = bestId;
  }

  const demoTakeaways: Record<string, string[]> = {};
  for (const e of entries) {
    const ranked = [...REGION_ORDER]
      .map((k) => ({ key: k, score: scoreFor(e.plan, k) }))
      .sort((a, b) => b.score - a.score);
    const top = ranked.slice(0, 2);
    const bottom = ranked[ranked.length - 1];
    demoTakeaways[e.id] = [
      `Strongest on ${REGION_LABELS[top[0].key]} (${top[0].score}) and ${REGION_LABELS[top[1].key]} (${top[1].score}).`,
      `Weakest on ${REGION_LABELS[bottom.key]} (${bottom.score}) — the biggest lever for the next iteration.`,
    ];
  }

  const headline =
    winnerLead > 0
      ? `${winner.label} takes the crown`
      : `${winner.label} edges out the field`;
  const subhead =
    winnerLead > 0
      ? `${winner.label} leads at ${winner.plan.score} — ${runnerUp.label} trails by ${winnerLead} points, primarily on ${REGION_LABELS[widestRegion]}.`
      : `Three plans within a point of each other; ${winner.label} takes ${REGION_LABELS[widestRegion]} as its standout region.`;

  return {
    headline,
    winner_demo_id: winner.id,
    subhead,
    per_region_winners: perRegionWinners,
    demo_takeaways: demoTakeaways,
  };
}

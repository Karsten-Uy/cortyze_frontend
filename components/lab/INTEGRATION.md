# Lab Design — Backend Integration TODO

The `/lab` route ships the new "Modern Lab / Scientific Minimalism" design from
the Claude Design handoff bundle. It is currently **fully mocked** — every value
the user sees is hardcoded in [`lib/lab/data.ts`](../../lib/lab/data.ts). This
doc is a punch list for wiring it to the real backend (`lib/api.ts`).

The existing `/` (Analyze) and `/compare` routes still use the old Tailwind UI.
Plan: prove the new design on `/lab` first, then move it to `/` once parity is
reached and the old code can be deleted.

## What's already real on `/lab`

- Layout, fonts (Inter / JetBrains Mono / Fraunces via `next/font/google`),
  PET-scan colour ramp, axial / sagittal / graph brain SVG, all interactive
  states (hover-sync, suggestion expansion, run animation, smooth-scroll).
- Mock run flow: clicking **Run analysis** waits 1.6s then scrolls to the
  insight view.

## What needs to be wired up

### 1. Replace mocks with live data

[`lib/lab/data.ts`](../../lib/lab/data.ts) needs to come from `lib/api.ts`.
Mapping:

| Lab field                        | Backend field                                            | Notes                                                                                  |
| -------------------------------- | -------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `LabHistoryItem` array           | `listReports({ limit: 200 }).items`                      | `score` ← `overall_score`, `goal` ← `Goal` enum mapped to display label, `thumb` derived from `content_type`. |
| `LabCampaign` array              | `listCampaigns()`                                        | Add `client` and `owner` to backend `Campaign` schema, or stop displaying them.        |
| `LabRegion[]` for current run    | `BrainReport.region_scores`                              | Translate `RegionKey` (`hippocampus`, `amygdala`, …) → lab keys (`hippo`, `amyg`, …) and join with the static `weight` / `blurb` / `x` / `y` / `r` constants below. |
| `LabRegionB[]`                   | second `BrainReport.region_scores` from `compareReports` | Same key translation.                                                                  |
| `LabSuggestion[]`                | `BrainReport.suggestions`                                | Map: `priority` (`critical|important|minor`) → `severity` (`critical|high|medium|low`), `timestamp_*_s` → `ts` string via `formatTimestamp`, `region` → display name, `delta` synthesised from `priority` (backend doesn't return a numeric lift — see issue below). |

### 2. Region key translation

The design uses short keys (`hippo`, `amyg`, `vis`, `temp`, `fusi`, `rew`,
`pfc`, `motor`); the backend uses long keys (`hippocampus`, `amygdala`,
`visual_cortex`, `temporal_language`, `fusiform_face`, `reward`, `prefrontal`,
`motor`). Add a small bidirectional map in `lib/lab/translate.ts`. Keep the
SVG positions (`x`, `y`, `r`) and per-goal weights (`weight`) on the lab side
since they're presentation concerns, not API data.

### 3. Goal labels

The lab UI shows `"Brand Recall"`, `"Purchase Intent"`, `"Emotional
Resonance"`, `"Trust"`, `"Attention"`. The backend's `Goal` type is
`"conversion" | "awareness" | "engagement" | "brand_recall"`. Decisions
needed:

- Are `Trust`, `Emotional Resonance`, `Purchase Intent`, `Attention` new
  goals? Then add them to `core/scoring/goals.py` with weight maps, and
  extend `Goal` in `lib/api.ts`.
- Or are they aliases of the existing four? Then map: `Brand Recall →
  brand_recall`, `Purchase Intent → conversion`, `Emotional Resonance →
  engagement`, `Attention → awareness`, and drop `Trust`.

The `weight` shown next to each region (e.g. "30% of brand recall") should
come from `GOAL_WEIGHTS[goal]` in `lib/api.ts` re-rendered as a
percentage, not from a hardcoded number.

### 4. Run flow

Replace `handleRun` in [`app/lab/page.tsx`](../../app/lab/page.tsx) with:

```ts
async function handleRun(payload) {
  setRunState("running");
  // 1. Upload media via uploadFile() — see UploadPanel.tsx for the existing flow.
  // 2. Build AnalyzeRequest. Map payload.goal (LabGoal) → Goal.
  // 3. Call analyze(req).
  // 4. Push the new report into the LabHistoryItem list, set currentRunId.
  setRunState("done");
  setView("insight");
}
```

The 1.6s artificial delay should be removed — real inference runs on the
backend and is signalled by the awaited `analyze()` promise.

### 5. Goal re-weighting

The composite Cortyze Index pill row in
[`InsightView.tsx`](./InsightView.tsx) currently flips a local `goal` state
and does nothing else. To make it actually re-weight:

- Instant client-side preview: read `BrainReport.overall_by_goal[goal]` if
  populated.
- Authoritative re-run: call `regoalReport(requestId, goal)` to mint a new
  report row with refreshed suggestions.

Decide whether the pill should preview only (free) or call /regoal (one
Anthropic call per click).

### 6. Brain map view (axial / sagittal / graph)

The view switcher is already wired client-side. No backend change needed
unless you want to persist the user's preferred view per-account; if so,
add `preferred_brain_view` to the user profile.

### 7. A/B Compare

`CompareView.tsx` currently hardcodes `regions` (Run A) and `regionsB`
(Run B). Wire to `compareReports(idA, idB)`:

- Read `result.report_a.region_scores` and `result.report_b.region_scores`.
- The takeaway cards ("Where B wins biggest", etc.) should be derived from
  `result.per_region_delta` — pick the largest positive and negative
  deltas, plus the LLM summary in `result.llm_summary` for the
  "Recommended action" card.

### 8. Campaign picker

`Header.tsx` reads campaigns from `LAB_DATA.campaigns`. Switch to
`listCampaigns()` and pipe `campaign_id` through to `analyze()` calls so
new runs land in the right campaign.

### 9. Sidebar history

The sidebar groups runs by date string ("Apr 30"). Replace with
`listReports().items`, format `created_at` for the date header, and use
`thumbnail_url` for `MiniThumb` (drop the four hardcoded shapes — replace
with a real `<img>` or a deterministic colour-block fallback).

### 10. Auth gate

`/lab` is currently outside the `(authed)` group, so it's reachable
without a Supabase session. Once it's the production route, move it
inside `(authed)` (or duplicate the proxy check) so anonymous users get
bounced to `/login`.

### 11. "Suggestion delta" wording

Suggestion cards show `"+18%"` style lifts. The backend's `Suggestion`
schema doesn't return a numeric expected lift. Options:

- Add an `expected_lift_pct` field to `Suggestion` populated by the LLM.
- Drop the `+18%` chip and the simulated example's MiniDelta and rely on
  the priority badge alone.

The simulated before / edit / after frames are pure illustration — keep
or remove based on whether you want a real preview later (e.g.
client-side video frame extraction + filter).

### 12. Tweaks panel

The original prototype shipped a draggable "Tweaks" panel for live
design tuning (brain view, sidebar collapse). It was a Claude-Design
host-protocol feature and is **not ported**. The Tweaks were duplicated
in-view (the brain view switcher inside the Insight pane already
exposes axial/sagittal/graph), so nothing is lost.

## Files to look at when wiring

- `lib/lab/data.ts` — replace constants with API calls.
- `app/lab/page.tsx` — `handleRun`, `handleSelectRun`, `handleNew`.
- `components/lab/InsightView.tsx` — goal pill row, suggestion card.
- `components/lab/CompareView.tsx` — replace `regionsB` source.
- `components/lab/Header.tsx` — `CampaignPicker`.
- `components/lab/Sidebar.tsx` — history grouping.

The existing UploadPanel + ReportView + Sidebar in `components/` (no
`lab/` prefix) already do most of this work against the backend — copy
the wiring patterns from there.

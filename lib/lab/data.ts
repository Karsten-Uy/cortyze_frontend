// Mock data for the Cortyze design prototype. Values come from the
// original HTML prototype's <script id="cortyze-data"> JSON block.
// Replace with real data from the backend when wiring the lab UI to the
// API — see LAB_DESIGN_TODO.md.

export type LabCampaign = {
  id: string;
  name: string;
  client: string;
  active: boolean;
  owner?: string;
};

export type LabHistoryItem = {
  id: string;
  title: string;
  ts: string;
  score: number;
  goal: string;
  thumb: "wellness" | "wellness2" | "video" | "portrait";
  active?: boolean;
};

export type LabRegion = {
  key: string;
  name: string;
  score: number;
  weight: number;
  blurb: string;
  x: number;
  y: number;
  r: number;
};

export type LabRegionB = {
  key: string;
  score: number;
};

export type LabSuggestion = {
  id: string;
  severity: "critical" | "high" | "medium" | "low";
  region: string;
  ts: string;
  title: string;
  body: string;
  delta: string;
  metric: string;
  exampleLabel?: string;
  exampleNote?: string;
};

export type LabData = {
  campaigns: LabCampaign[];
  history: LabHistoryItem[];
  regions: LabRegion[];
  regionsB: LabRegionB[];
  suggestions: LabSuggestion[];
};

export const LAB_DATA: LabData = {
  campaigns: [
    { id: "q3w", name: "Q3 Wellness Launch", client: "Lumen Skincare", active: true, owner: "Maya" },
    { id: "evw", name: "Evergreen DTC", client: "Northwall Co.", active: false },
    { id: "hol", name: "Holiday '26 Teaser", client: "Bayshore Foods", active: false },
  ],
  history: [
    { id: "r-014", title: "Hero — 'Reset Ritual' v3", ts: "Apr 30, 14:22", score: 35.2, goal: "Brand Recall", thumb: "wellness", active: true },
    { id: "r-013", title: "Carousel — 'Skin Diary'", ts: "Apr 30, 11:08", score: 64.1, goal: "Brand Recall", thumb: "wellness2" },
    { id: "r-012", title: "15s spot — 'First Light'", ts: "Apr 29, 17:44", score: 58.7, goal: "Purchase Intent", thumb: "video" },
    { id: "r-011", title: "Hero — 'Reset Ritual' v2", ts: "Apr 29, 09:30", score: 41.6, goal: "Brand Recall", thumb: "wellness" },
    { id: "r-010", title: "Static — Founder portrait", ts: "Apr 28, 16:02", score: 71.3, goal: "Trust", thumb: "portrait" },
    { id: "r-009", title: "Hero — 'Reset Ritual' v1", ts: "Apr 28, 10:14", score: 28.9, goal: "Brand Recall", thumb: "wellness" },
  ],
  regions: [
    { key: "hippo", name: "Hippocampus", score: 36, weight: 30, blurb: "Brand recall — will they remember this?", x: 50, y: 56, r: 6 },
    { key: "amyg", name: "Amygdala", score: 34, weight: 20, blurb: "Emotional impact — excitement, surprise, urgency", x: 44, y: 60, r: 5 },
    { key: "vis", name: "Visual Cortex", score: 31, weight: 15, blurb: "How strongly visuals grab attention", x: 50, y: 84, r: 9 },
    { key: "temp", name: "Temporal / Language", score: 40, weight: 12, blurb: "How well the message is being processed", x: 30, y: 62, r: 7 },
    { key: "fusi", name: "Fusiform Face", score: 38, weight: 10, blurb: "Whether faces create personal connection", x: 38, y: 76, r: 5 },
    { key: "rew", name: "Reward (NAcc/VTA)", score: 34, weight: 8, blurb: "Does the content feel rewarding?", x: 50, y: 50, r: 5 },
    { key: "pfc", name: "Prefrontal", score: 33, weight: 3, blurb: "Purchase intent — is the viewer considering action?", x: 50, y: 26, r: 8 },
    { key: "motor", name: "Motor", score: 31, weight: 2, blurb: "Impulse to act — swipe, click, buy", x: 60, y: 36, r: 5 },
  ],
  regionsB: [
    { key: "hippo", score: 58 },
    { key: "amyg", score: 71 },
    { key: "vis", score: 64 },
    { key: "temp", score: 49 },
    { key: "fusi", score: 77 },
    { key: "rew", score: 62 },
    { key: "pfc", score: 55 },
    { key: "motor", score: 48 },
  ],
  suggestions: [
    {
      id: "s1", severity: "critical", region: "Amygdala", ts: "0:01–0:05",
      title: "Add a stakes moment in the opening frame",
      body: "Your hero opens on a calm product still. Brain recall regions remain quiet through the first 1.4s — the amygdala only registers a faint deflection at 0:03. Introducing a low-grade tension cue (a near-spill, a held breath, a sudden directional change) inside the first beat raises emotional encoding by ~18% in comparable wellness ads.",
      delta: "+18%", metric: "Amygdala lift",
      exampleLabel: "Reference: Aesop, 'Othertime' 2024", exampleNote: "Opens on a porcelain cup tipping, caught at the last frame. Amygdala spike at 0:02.",
    },
    {
      id: "s2", severity: "high", region: "Hippocampus", ts: "0:00–0:30",
      title: "Anchor a single recurring symbol",
      body: "The ad introduces three product cues without repetition. Memory consolidation favors one symbol shown three times over three symbols shown once. Pick the bottle silhouette and re-cue it at 0:08 and 0:24.",
      delta: "+11%", metric: "Recall at 24h",
      exampleLabel: "Reference: Glossier, 'You' campaign", exampleNote: "Pink-bottle silhouette returns 4× in 20s.",
    },
    {
      id: "s3", severity: "high", region: "Visual Cortex", ts: "0:06–0:11",
      title: "Increase contrast on the primary subject",
      body: "Saliency map shows attention diffusing across mid-tones in this stretch. Pushing the subject 1.5 stops above the background — or adding a single saturated accent — concentrates fixation on the brand asset.",
      delta: "+9%", metric: "Fixation density",
    },
    {
      id: "s4", severity: "medium", region: "Fusiform Face", ts: "0:12–0:18",
      title: "Hold the face shot 0.4s longer",
      body: "Face presentation is below threshold for FFA encoding. Below ~600ms the viewer registers a person but not a person. Extending to 1s lifts personal connection without slowing pace meaningfully.",
      delta: "+6%", metric: "Personal connection",
    },
    {
      id: "s5", severity: "medium", region: "Temporal / Language", ts: "0:22",
      title: "Compress the closing line to ≤5 words",
      body: "Current voiceover ends on an 11-word benefit statement. Working memory degrades sharply past 7 words at this pacing. A tighter line (e.g. 'Reset, every morning.') keeps the message intact.",
      delta: "+5%", metric: "Message retention",
    },
    {
      id: "s6", severity: "low", region: "Reward", ts: "0:28–0:30",
      title: "Add a sensory pay-off on the final beat",
      body: "The end-card resolves visually but not viscerally. A 0.5s tactile cue (water bead, breath, fabric flex) before the logo activates reward circuitry without extending runtime.",
      delta: "+3%", metric: "Reward activation",
    },
  ],
};

export const LAB_GOALS = [
  "Brand Recall",
  "Purchase Intent",
  "Emotional Resonance",
  "Trust",
  "Attention",
] as const;

export type LabGoal = (typeof LAB_GOALS)[number];

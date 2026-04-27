// Thin typed fetch wrapper for the Cortyze backend.
// Backend URL via NEXT_PUBLIC_API_URL; defaults to http://localhost:8000.

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export type Goal = "conversion" | "awareness" | "engagement" | "brand_recall";

export const GOALS: Goal[] = [
  "conversion",
  "awareness",
  "engagement",
  "brand_recall",
];

export const REGION_KEYS = [
  "visual_cortex",
  "fusiform_face",
  "amygdala",
  "prefrontal",
  "temporal_language",
  "hippocampus",
  "motor",
  "reward",
] as const;

export type RegionKey = (typeof REGION_KEYS)[number];

export const REGION_LABELS: Record<RegionKey, string> = {
  visual_cortex: "Visual Cortex",
  fusiform_face: "Fusiform Face",
  amygdala: "Amygdala",
  prefrontal: "Prefrontal",
  temporal_language: "Temporal / Language",
  hippocampus: "Hippocampus",
  motor: "Motor",
  reward: "Reward",
};

export type RegionInsight = {
  /** One-line marketing translation, always visible on the card. */
  short: string;
  /** What each region actually measures. */
  full: string;
  /** What an above-average score means for the creator. */
  high: string;
  /** What a below-average score means for the creator. */
  low: string;
};

export const REGION_INSIGHTS: Record<RegionKey, RegionInsight> = {
  visual_cortex: {
    short: "How strongly visuals grab attention",
    full: "Primary + secondary visual cortex. Lights up when the eye is caught — by motion, contrast, fast cuts, or strong composition.",
    high: "Your visuals are striking. The eye stays engaged frame to frame.",
    low: "Visuals may be static, low-contrast, or background-y. Try faster cuts, sharper composition, or motion in the first second.",
  },
  fusiform_face: {
    short: "Whether faces create personal connection",
    full: "Fusiform face area — the brain's specialized face detector. Activates for clear, well-lit, emotionally legible human faces, especially with eye contact.",
    high: "Faces in your content are clear and forge a personal hook.",
    low: "Few or obscured faces. A short close-up of a human reaction lifts this fast.",
  },
  amygdala: {
    short: "Emotional impact — excitement, surprise, urgency",
    full: "Limbic emotional processing (insula as cortical proxy). Spikes for surprise, awe, fear, anticipation — anything felt rather than thought.",
    high: "Content provokes a felt emotional reaction.",
    low: "Emotionally flat. Add a stakes moment, an unexpected beat, or a reaction shot.",
  },
  prefrontal: {
    short: "Purchase intent — is the viewer considering action?",
    full: "Prefrontal cortex — higher-order evaluation, weighing options, predicting outcomes. Engaged when the viewer is mentally trying the product on.",
    high: "Viewer is mentally weighing your offer.",
    low: "Content doesn't prompt consideration. Make the use-case concrete, the benefit specific.",
  },
  temporal_language: {
    short: "How well the message is being processed",
    full: "Superior + middle temporal regions. Speech, narration, dialogue, even music lyrics — anywhere the brain is decoding meaning from sound.",
    high: "Audio and language content is clear and meaningful.",
    low: "Message isn't landing. Voiceover may be too fast, music too dense, or audio absent.",
  },
  hippocampus: {
    short: "Brand recall — will they remember this?",
    full: "Memory encoding. Strong activation at peak moments correlates with later recall of brand, content, and call-to-action.",
    high: "This will be remembered and re-cued later.",
    low: "Forgettable. Add a distinctive sonic logo, a hook line, or a memorable visual signature.",
  },
  motor: {
    short: "Impulse to act — swipe, click, buy",
    full: "Pre/post/paracentral motor regions. Activate when viewers mentally rehearse a physical action — pressing, reaching, swiping.",
    high: "Triggers an urge to act now.",
    low: "No call-to-action registers. Make the action visible (a finger tapping, a hand reaching) and the next step obvious.",
  },
  reward: {
    short: "Does the content feel rewarding?",
    full: "Cingulate reward circuitry. Music payoffs, narrative resolution, and beat drops all light this up.",
    high: "Watching this feels satisfying.",
    low: "No payoff. Give the viewer a moment of release — a beat drop, a transformation, an ah-ha.",
  },
};

/** Per-goal region weights — must mirror cortyze_product/core/scoring/goals.py:GOAL_WEIGHTS. */
export const GOAL_WEIGHTS: Record<Goal, Record<RegionKey, number>> = {
  conversion: {
    visual_cortex: 0.12,
    fusiform_face: 0.02,
    amygdala: 0.10,
    prefrontal: 0.25,
    temporal_language: 0.08,
    hippocampus: 0.05,
    motor: 0.20,
    reward: 0.18,
  },
  awareness: {
    visual_cortex: 0.25,
    fusiform_face: 0.10,
    amygdala: 0.25,
    prefrontal: 0.05,
    temporal_language: 0.05,
    hippocampus: 0.20,
    motor: 0.02,
    reward: 0.08,
  },
  engagement: {
    visual_cortex: 0.18,
    fusiform_face: 0.15,
    amygdala: 0.25,
    prefrontal: 0.02,
    temporal_language: 0.05,
    hippocampus: 0.10,
    motor: 0.05,
    reward: 0.20,
  },
  brand_recall: {
    visual_cortex: 0.15,
    fusiform_face: 0.10,
    amygdala: 0.20,
    prefrontal: 0.03,
    temporal_language: 0.12,
    hippocampus: 0.30,
    motor: 0.02,
    reward: 0.08,
  },
};

export type AnalyzeRequest = {
  content_url: string;
  content_type: "video" | "image" | "text";
  goal: Goal;
  user_id?: string | null;
  request_id?: string;
};

export type MomentEvent = {
  type: "Word" | "Sentence" | "Audio" | "Video" | "Unknown";
  start_s: number;
  duration_s: number;
  text: string | null;
};

export type Moment = {
  region: RegionKey;
  type: "dip" | "peak";
  start_s: number;
  end_s: number;
  avg_score: number;
  context: string;
  events: MomentEvent[];
};

export type SuggestionPriority = "critical" | "important" | "minor";

export type Suggestion = {
  region: RegionKey;
  priority: SuggestionPriority;
  title: string;
  fix: string;
  why: string;
  timestamp_start_s: number | null;
  timestamp_end_s: number | null;
  examples: string[];
};

export type BrainReport = {
  request_id: string;
  region_scores: Record<RegionKey, number>;
  overall_score: number;
  goal: Goal;
  user_id: string | null;
  model_version: string;
  raw_predictions_uri: string | null;
  brain_image_b64: string | null;
  elapsed_ms: number;
  /** Per-region per-second scores [0..100], length T (1 entry per second of input). */
  region_timeseries: Record<RegionKey, number[]> | null;
  /** Dip + peak windows detected across all regions. */
  moments: Moment[];
  /** Stage 2: per-region actionable diagnoses, sorted critical → important → minor. */
  suggestions: Suggestion[];
};

/** Format `seconds` as `M:SS` or `H:MM:SS` for display. */
export function formatTimestamp(seconds: number): string {
  const total = Math.max(0, Math.round(seconds));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export type UploadUrls = {
  put_url: string;
  get_url: string;
  content_url: string;
};

/** Mint a presigned upload URL, then PUT the file directly to object storage. */
export async function uploadFile(file: File): Promise<string> {
  const r = await fetch(`${API_URL}/upload-url?content_type=${encodeURIComponent(file.type || "video/mp4")}`, {
    method: "POST",
  });
  if (!r.ok) {
    throw new Error(`Failed to mint upload URL: ${r.status} ${await r.text()}`);
  }
  const urls: UploadUrls = await r.json();
  const put = await fetch(urls.put_url, {
    method: "PUT",
    headers: { "content-type": file.type || "video/mp4" },
    body: file,
  });
  if (!put.ok) {
    throw new Error(`Upload failed: ${put.status} ${await put.text()}`);
  }
  return urls.content_url;
}

export async function analyze(req: AnalyzeRequest): Promise<BrainReport> {
  const r = await fetch(`${API_URL}/analyze`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(req),
  });
  if (!r.ok) {
    const detail = await r.text();
    throw new Error(`Analyze failed: ${r.status} ${detail}`);
  }
  return r.json();
}

export async function health(): Promise<{ status: string }> {
  const r = await fetch(`${API_URL}/health`);
  if (!r.ok) throw new Error(`Health check failed: ${r.status}`);
  return r.json();
}

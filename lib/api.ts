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

export type AnalyzeRequest = {
  content_url: string;
  content_type: "video" | "image" | "text";
  goal: Goal;
  user_id?: string | null;
  request_id?: string;
};

export type BrainReport = {
  request_id: string;
  region_scores: Record<RegionKey, number>;
  overall_score: number;
  goal: Goal;
  user_id: string | null;
  model_version: string;
  raw_predictions_uri: string | null;
  elapsed_ms: number;
};

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

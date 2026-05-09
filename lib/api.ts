// Typed client for the Cortyze backend `/runs` family of endpoints.
//
// Auth: when a Supabase session exists, the JWT is attached as
// `Authorization: Bearer <jwt>`. When no session exists (dev,
// AUTH_DISABLED on backend), requests go through anonymously and the
// backend's `optional_user` dependency accepts them.
//
// Base URL: `NEXT_PUBLIC_API_URL` (defaults to http://localhost:8000).
//
// Long-running jobs use `waitForRun()` which polls GET /runs/{id} on
// a short interval. SSE is documented in the architecture doc but
// EventSource can't set Authorization headers, so the simplest
// auth-compatible path is polling. Mock-mode runs complete in <100ms,
// so polling at 200ms is fine; for real TRIBE (3-12 min) we'd want
// SSE-with-token-as-query-param or a fetch-streaming reader.

import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// ----------------------------------------------------------------------------
// Types — must match backend `core/schemas_v2.py` exactly.
// ----------------------------------------------------------------------------

export type RegionKey =
  | "memory"
  | "emotion"
  | "attention"
  | "language"
  | "face"
  | "reward";

export type Priority = "critical" | "high" | "medium";

export type Status = "Needs work" | "Solid" | "Strong" | "Hero";

export type GoalKey =
  | "brand_recall"
  | "purchase_intent"
  | "emotional_resonance"
  | "trust"
  | "attention";

export type RunStatus =
  | "queued"
  | "neuro_running"
  | "neuro_done"
  | "context_running"
  | "context_done"
  | "synthesizing"
  | "plan_done"
  | "validating"
  | "complete"
  | "failed";

export type RegionScore = {
  key: RegionKey;
  score: number;
  benchmark: number;
};

export type Reference = {
  brand: string;
  campaign: string;
  note: string;
  scoreA: number;
  labelA: string;
  scoreB: number;
  labelB: string;
};

export type Suggestion = {
  id: number;
  priority: Priority;
  title: string;
  area: RegionKey;
  lift: number;
  explanation: string;
  reference: Reference | null;
  // Slugs of registered library examples; lazy-fetched on card expand.
  examples?: string[];
  // Window (seconds) in the user's clip where this region peaks. Drives
  // the per-suggestion clip player. `null` for image runs / older runs.
  peak_start_s?: number | null;
  peak_end_s?: number | null;
};

// Matches the backend's ExampleAd Pydantic model (api/routes/examples.py).
export type ExampleAd = {
  name: string;
  display_name: string;
  description: string;
  source_url: string;
  license: string;
  region_scores: Record<string, number>;
  overall_by_goal: Record<string, number>;
  thumbnail_url: string | null;
  tags: string[];
  content_type: string | null;
  caption: string | null;
  // Total clip duration in seconds, or null for image-only ads.
  duration_s: number | null;
  // {legacy_region_key: [peak_start_s, peak_end_s]}. Drives the embedded
  // player's start time so the user sees the section of the example ad
  // where this region peaks.
  peak_windows: Record<string, [number, number]>;
};

export type SuggestionPlan = {
  score: number;
  benchmark: number;
  delta: number;
  status: Status;
  regions: RegionScore[];
  suggestions: Suggestion[];
};

export type RunRecord = {
  id: string;
  user_id: string | null;
  name: string;
  goal: GoalKey;
  brief: string;
  caption: string;
  media_url: string | null;
  media_object_key: string | null;
  kind: "Video" | "Image";
  status: RunStatus;
  created_at: string;
  completed_at: string | null;
  result: SuggestionPlan | null;
  error: string | null;
  // Set when the run was started via a "Try a sample" card; null for
  // real uploads. Lets the demo build restore the same sample after
  // an Edit & re-score round-trip.
  demo_id: string | null;
};

export type PastRun = {
  id: string;
  name: string;
  date: string;
  kind: "Video" | "Image";
  score: number;
};

export type CreateRunInput = {
  name: string;
  goal: GoalKey;
  brief?: string;
  caption?: string;
  media_url?: string | null;
  // R2 object key from /upload-url; lets GET /runs/:id re-presign
  // a fresh media_url after the original 1h TTL elapses.
  media_object_key?: string | null;
  kind?: "Video" | "Image";
  // Set when the user clicked a "Try a sample" card on the Lab bench.
  // Backend short-circuits the real pipeline and loads the canned plan
  // from data/demo_runs/<demo_id>.json.
  demo_id?: string | null;
};

// Matches services/demo.DemoSummary — surface for the Lab-bench "Try
// a sample" cards. The full canned plan is fetched server-side after
// `createRun({demo_id})` lands in the orchestrator.
export type DemoSummary = {
  demo_id: string;
  label: string;
  tagline: string;
  thumbnail_url: string;
  kind: "Video" | "Image";
  form_defaults: {
    name: string;
    goal: GoalKey;
    brief: string;
    caption: string;
  };
  // Source URL (typically YouTube) for the sample clip. Used by the
  // Lab-bench sample-card thumbnail to open the original in a new tab.
  media_url: string | null;
};

// Full demo payload (including the canned plan) — fetched once per demo
// by the Compare page so it can render all 3 plans side-by-side without
// triggering 3 fake runs through the orchestrator.
export type DemoRun = DemoSummary & {
  media_url: string | null;
  media_object_key: string | null;
  plan: SuggestionPlan;
};

// Hand-written narrative for the 3-demo comparison. Keys in
// `per_region_winners` are RegionKey strings; values are demo_ids.
// `demo_takeaways` is keyed by demo_id.
export type ComparisonNarrative = {
  headline: string;
  winner_demo_id: string;
  subhead: string;
  per_region_winners: Record<RegionKey, string>;
  demo_takeaways: Record<string, string[]>;
};

export type Profile = {
  user_id: string;
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type UploadUrlResponse = {
  put_url: string;
  get_url: string;
  // Stable R2 key — round-trip on POST /runs so the API can re-presign
  // a fresh `media_url` after the original 1h TTL elapses.
  object_key: string;
  content_type: string;
};

// ----------------------------------------------------------------------------
// HTTP helpers
// ----------------------------------------------------------------------------

async function authHeaders(): Promise<Record<string, string>> {
  // Skip Supabase entirely if env vars aren't configured — frontend
  // works against a backend with AUTH_DISABLED=true without any
  // Supabase setup, useful during local dev.
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return {};
  }
  try {
    const supabase = createSupabaseBrowserClient();
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const auth = await authHeaders();
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...auth,
      ...(init.headers ?? {}),
    },
  });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = body?.detail ?? detail;
    } catch {
      /* response wasn't JSON */
    }
    throw new ApiError(res.status, `${res.status} ${detail}`);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

// ----------------------------------------------------------------------------
// Endpoints
// ----------------------------------------------------------------------------

export async function createRun(
  input: CreateRunInput,
): Promise<{ run_id: string }> {
  return request<{ run_id: string }>("/runs", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

// Reference-ad library lookups. Public (no auth required) — these are
// curated content, not user data. Backed by the manifests in
// cortyze_product/data/reference_ads/.
export async function fetchExample(name: string): Promise<ExampleAd> {
  return request<ExampleAd>(`/examples/${encodeURIComponent(name)}`);
}

export async function listExamples(): Promise<ExampleAd[]> {
  return request<ExampleAd[]>("/examples");
}

export async function getRun(runId: string): Promise<RunRecord> {
  return request<RunRecord>(`/runs/${encodeURIComponent(runId)}`);
}

export async function listRuns(limit = 20): Promise<PastRun[]> {
  return request<PastRun[]>(`/runs?limit=${limit}`);
}

// "Try a sample" cards on the Lab bench. Public endpoint; safe to
// call without a session.
export async function listDemos(): Promise<DemoSummary[]> {
  return request<DemoSummary[]>("/demos");
}

// Full demo payload — used by the Compare page to load all 3 plans
// in parallel (Promise.all over the 3 demo_ids).
export async function getDemoRun(demoId: string): Promise<DemoRun> {
  return request<DemoRun>(`/demos/${encodeURIComponent(demoId)}`);
}

// Hand-written copy for a pairwise demo comparison. The Compare page
// falls back to a deterministic delta-based narrative if this call
// fails (lib/compareNarrative.ts). Order-independent on the backend.
export async function getComparisonNarrative(
  a: string,
  b: string,
): Promise<ComparisonNarrative> {
  const params = new URLSearchParams({ a, b });
  return request<ComparisonNarrative>(`/demos/comparison?${params.toString()}`);
}

/**
 * Poll GET /runs/{id} until the run reaches a terminal state.
 * Resolves with the SuggestionPlan on `complete`; rejects on `failed`
 * or timeout.
 */
export async function waitForRun(
  runId: string,
  opts: { intervalMs?: number; timeoutMs?: number } = {},
): Promise<SuggestionPlan> {
  const intervalMs = opts.intervalMs ?? 250;
  const timeoutMs = opts.timeoutMs ?? 60_000;
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const record = await getRun(runId);
    if (record.status === "complete" && record.result) {
      return record.result;
    }
    if (record.status === "failed") {
      throw new ApiError(
        500,
        record.error ?? "Run failed without an error message",
      );
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new ApiError(504, `run ${runId} did not finish in ${timeoutMs}ms`);
}

// ----------------------------------------------------------------------------
// Profile
// ----------------------------------------------------------------------------

export async function getMe(): Promise<Profile> {
  return request<Profile>("/me");
}

export async function updateMe(
  patch: { display_name?: string; avatar_url?: string },
): Promise<Profile> {
  return request<Profile>("/me", {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

// ----------------------------------------------------------------------------
// Upload (R2 presigned PUT)
// ----------------------------------------------------------------------------

export async function mintUploadUrl(
  file: { name: string; type: string; size: number },
): Promise<UploadUrlResponse> {
  return request<UploadUrlResponse>("/upload-url", {
    method: "POST",
    body: JSON.stringify({
      filename: file.name,
      content_type: file.type,
      size: file.size,
    }),
  });
}

/**
 * PUT a File to a presigned R2 URL with progress reporting.
 *
 * `fetch` doesn't support upload progress events natively (the
 * streaming-uploads spec is still landing in browsers), so we drop to
 * XHR. Resolves once the upload completes; rejects on network error
 * or non-2xx status.
 */
export function uploadFileToR2(
  putUrl: string,
  file: File,
  onProgress?: (loaded: number, total: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", putUrl);
    xhr.setRequestHeader("Content-Type", file.type);
    if (onProgress) {
      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) onProgress(e.loaded, e.total);
      });
    }
    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new ApiError(xhr.status, `R2 PUT failed: ${xhr.status} ${xhr.statusText}`));
    });
    xhr.addEventListener("error", () =>
      reject(new ApiError(0, "Network error during upload")),
    );
    xhr.addEventListener("abort", () =>
      reject(new ApiError(0, "Upload aborted")),
    );
    xhr.send(file);
  });
}

// ----------------------------------------------------------------------------
// Sign out — small wrapper so callers don't have to import Supabase directly
// ----------------------------------------------------------------------------

export async function signOut(): Promise<void> {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return; // No Supabase configured — nothing to sign out of.
  }
  const supabase = createSupabaseBrowserClient();
  await supabase.auth.signOut();
}

export { ApiError };

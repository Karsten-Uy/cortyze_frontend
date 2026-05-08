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
  kind: "Video" | "Image";
  status: RunStatus;
  created_at: string;
  completed_at: string | null;
  result: SuggestionPlan | null;
  error: string | null;
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
  kind?: "Video" | "Image";
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

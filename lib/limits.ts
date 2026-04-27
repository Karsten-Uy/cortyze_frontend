// Upload size thresholds. Frontend-only enforcement for now; Stage 3
// hardens with a content-length-range condition on the presigned URL.

/** Hard ceiling — files larger than this are refused outright. */
export const HARD_LIMIT_BYTES = 1 * 1024 * 1024 * 1024; // 1 GB

/** Files at or above this size trigger the "compress before upload" prompt. */
export const COMPRESS_THRESHOLD_BYTES = 50 * 1024 * 1024; // 50 MB

/** What the compressor targets. Used to set the user's expectation, not a guarantee. */
export const COMPRESS_TARGET_BYTES = 15 * 1024 * 1024; // ~15 MB

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

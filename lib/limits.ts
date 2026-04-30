// Upload size thresholds. Frontend-only enforcement for now; Stage 3
// hardens with a content-length-range condition on the presigned URL.

/** Hard ceiling for video — files larger than this are refused outright. */
export const HARD_LIMIT_BYTES = 1 * 1024 * 1024 * 1024; // 1 GB

/** Files at or above this size trigger the "compress before upload" prompt. */
export const COMPRESS_THRESHOLD_BYTES = 50 * 1024 * 1024; // 50 MB

/** What the compressor targets. Used to set the user's expectation, not a guarantee. */
export const COMPRESS_TARGET_BYTES = 15 * 1024 * 1024; // ~15 MB

/** Hard ceiling for post images. Most JPEG/PNG/WebP under any reasonable
 *  resolution are well under this; anything bigger is almost certainly a
 *  raw camera dump that won't help V-JEPA (which downsamples to 256px). */
export const IMAGE_HARD_LIMIT_BYTES = 25 * 1024 * 1024; // 25 MB

/** Hard ceiling for post audio. ~30 minutes of decent-quality MP3.
 *  Longer than that and you almost certainly want the video flow. */
export const AUDIO_HARD_LIMIT_BYTES = 50 * 1024 * 1024; // 50 MB

/** Caption length cap. Roughly two Instagram captions (~2200 chars × 2). */
export const CAPTION_MAX_CHARS = 5000;

/** Min and max images for a Post.
 *
 *  The frontend exposes one unified "Post" tab covering both single-image
 *  and multi-image (carousel) cases — the backend `content_type` is
 *  picked at submit time:
 *    - 1 image  → backend `content_type="post"`
 *    - 2+ images → backend `content_type="gallery"` (validator requires ≥2)
 *
 *  The frontend MIN is therefore 1 (any number of images is a valid post);
 *  the MAX matches the backend gallery cap of 20. */
export const POST_MIN_IMAGES = 1;
export const POST_MAX_IMAGES = 20;
/** Threshold above which the backend `content_type="gallery"` is used. */
export const GALLERY_THRESHOLD_IMAGES = 2;

/** Default per-image hold time for multi-image posts. Matches Instagram's
 *  auto-advance feel and the backend's default `seconds_per_image`. Only
 *  surfaced in the UI when the user has added ≥2 images. */
export const GALLERY_DEFAULT_SECONDS_PER_IMAGE = 2.5;
export const GALLERY_MIN_SECONDS_PER_IMAGE = 0.5;
export const GALLERY_MAX_SECONDS_PER_IMAGE = 10.0;

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

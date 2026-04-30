"use client";

import { useEffect, useState } from "react";

import { Dropzone } from "@/components/Dropzone";
import {
  GOALS,
  type AnalyzeRequest,
  type BrainReport,
  type CampaignSummary,
  type Goal,
  analyze,
  listCampaigns,
  uploadFile,
} from "@/lib/api";

type MediaKind = "video" | "post" | null;

const MAX_IMAGE_BYTES = 25 * 1024 * 1024;
const MAX_VIDEO_BYTES = 200 * 1024 * 1024;
const MAX_AUDIO_BYTES = 50 * 1024 * 1024;

const GOAL_LABELS: Record<Goal, string> = {
  conversion: "Conversion",
  awareness: "Awareness",
  engagement: "Engagement",
  brand_recall: "Brand Recall",
};

/**
 * Unified pre-run input panel. One dropzone takes a video OR up to 20
 * images; the kind is auto-detected from the first dropped file's MIME
 * type. Subsequent fields adapt:
 *
 *   video   → no separate audio (video carries its own track), caption
 *             optional but accepted for the language path
 *   post    → audio upload appears, seconds-per-image visible, caption
 *             still optional but recommended (image-only is two
 *             modalities short)
 *
 * Caption, title, brand context, campaign, and goal are universal.
 */
export function UploadPanel({
  onComplete,
  initialCampaignId,
}: {
  onComplete: (report: BrainReport) => void;
  initialCampaignId?: string | null;
}) {
  const [mediaKind, setMediaKind] = useState<MediaKind>(null);

  // Video state
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState("");

  // Post state
  const [postImages, setPostImages] = useState<File[]>([]);
  const [postImageUrls, setPostImageUrls] = useState<string[]>([]);
  const [secondsPerImage, setSecondsPerImage] = useState(2.5);

  // Audio state — only meaningful for posts
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState("");
  const [audioSource, setAudioSource] = useState<"upload" | "url">("upload");

  // Always-on fields
  const [caption, setCaption] = useState("");
  const [title, setTitle] = useState("");
  const [additionalContext, setAdditionalContext] = useState("");
  const [campaignId, setCampaignId] = useState<string | null>(
    initialCampaignId ?? null,
  );
  const [campaigns, setCampaigns] = useState<CampaignSummary[]>([]);
  const [goal, setGoal] = useState<Goal>("engagement");

  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listCampaigns().then(setCampaigns).catch(() => {});
  }, []);

  // Helpers ---------------------------------------------------------------

  const imagesShownCount = postImages.length + postImageUrls.length;
  const hasMedia =
    mediaKind === "video"
      ? videoFile !== null || videoUrl.trim() !== ""
      : mediaKind === "post"
        ? imagesShownCount > 0
        : false;

  function clearError() {
    if (error) setError(null);
  }

  function resetMedia() {
    setMediaKind(null);
    setVideoFile(null);
    setVideoUrl("");
    setPostImages([]);
    setPostImageUrls([]);
    setAudioFile(null);
    setAudioUrl("");
  }

  /** Files just landed in the unified dropzone — branch on MIME type. */
  function handleDroppedFiles(files: File[]) {
    if (files.length === 0) return;

    const videos = files.filter((f) => f.type.startsWith("video/"));
    const images = files.filter((f) => f.type.startsWith("image/"));

    if (videos.length > 0) {
      // Video wins. Take the first; warn if more came along.
      setMediaKind("video");
      setVideoFile(videos[0]);
      if (videos.length > 1 || images.length > 0) {
        setError(
          "Took the first video. Drop only one video, or only images for a carousel.",
        );
      }
      return;
    }
    if (images.length > 0) {
      setMediaKind("post");
      setPostImages((prev) => {
        const next = [...prev, ...images];
        if (next.length > 20) {
          setError("Capped at 20 images per post; extras were dropped.");
        }
        return next.slice(0, 20);
      });
      return;
    }
    setError("Unsupported file type. Drop a video or image(s).");
  }

  function addImageUrlSlot() {
    if (mediaKind === null) setMediaKind("post");
    setPostImageUrls([...postImageUrls, ""]);
  }
  function setImageUrlAt(i: number, value: string) {
    const next = [...postImageUrls];
    next[i] = value;
    setPostImageUrls(next);
  }
  function removeImageUrlAt(i: number) {
    const next = postImageUrls.filter((_, idx) => idx !== i);
    setPostImageUrls(next);
    if (next.length === 0 && postImages.length === 0 && !videoFile && !videoUrl) {
      setMediaKind(null);
    }
  }
  function removeImageFileAt(i: number) {
    const next = postImages.filter((_, idx) => idx !== i);
    setPostImages(next);
    if (next.length === 0 && postImageUrls.length === 0 && !videoFile && !videoUrl) {
      setMediaKind(null);
    }
  }

  // Submit ----------------------------------------------------------------

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!hasMedia) {
      setError("Add a video or at least one image before running.");
      return;
    }

    setBusy(true);
    try {
      let req: AnalyzeRequest;

      if (mediaKind === "video") {
        let url = videoUrl;
        if (videoFile) {
          setStage("Uploading video…");
          url = await uploadFile(videoFile);
        }
        if (!url) throw new Error("Provide a video URL or upload a file.");
        req = {
          content_type: "video",
          goal,
          content_url: url,
          caption: caption.trim() || null,
          title: title || null,
          additional_context: additionalContext || null,
          campaign_id: campaignId,
        };
      } else {
        // post
        const urls: string[] = [];
        if (postImageUrls.length > 0) urls.push(...postImageUrls.filter(Boolean));
        if (postImages.length > 0) {
          setStage(`Uploading ${postImages.length} image(s)…`);
          for (const f of postImages) {
            urls.push(await uploadFile(f));
          }
        }
        if (urls.length === 0) {
          throw new Error("Add at least one image (1-20).");
        }
        if (urls.length > 20) {
          throw new Error("Posts can have at most 20 images.");
        }
        let resolvedAudio: string | null = null;
        if (audioSource === "upload" && audioFile) {
          setStage("Uploading audio…");
          resolvedAudio = await uploadFile(audioFile);
        } else if (audioSource === "url" && audioUrl.trim()) {
          resolvedAudio = audioUrl.trim();
        }
        if (!resolvedAudio && !caption.trim()) {
          throw new Error(
            "Posts need at least one of audio or caption (image-only posts produce very weak Engagement / Brand Recall scores).",
          );
        }
        req = {
          content_type: "post",
          goal,
          image_urls: urls,
          audio_url: resolvedAudio,
          caption: caption.trim() || null,
          seconds_per_image: secondsPerImage,
          title: title || null,
          additional_context: additionalContext || null,
          campaign_id: campaignId,
        };
      }

      setStage(
        "Analyzing… this can take a few seconds in mock mode, several minutes with real inference.",
      );
      const report = await analyze(req);
      setBusy(false);
      setStage("");
      onComplete(report);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setBusy(false);
      setStage("");
    }
  }

  // Render ----------------------------------------------------------------

  return (
    <form onSubmit={handleSubmit} className="space-y-5" onChange={clearError}>
      {/* Unified media */}
      <div className="card p-4">
        {mediaKind === null ? (
          <EmptyMediaPicker
            onFiles={handleDroppedFiles}
            videoUrl={videoUrl}
            setVideoUrl={(v) => {
              setVideoUrl(v);
              if (v.trim()) setMediaKind("video");
              else if (!videoFile) setMediaKind(null);
            }}
            onAddImageUrl={addImageUrlSlot}
            disabled={busy}
          />
        ) : mediaKind === "video" ? (
          <VideoSection
            videoFile={videoFile}
            videoUrl={videoUrl}
            setVideoUrl={setVideoUrl}
            onRemoveFile={() => {
              setVideoFile(null);
              if (!videoUrl.trim()) setMediaKind(null);
            }}
            onClearAll={resetMedia}
            disabled={busy}
          />
        ) : (
          <PostSection
            postImages={postImages}
            postImageUrls={postImageUrls}
            secondsPerImage={secondsPerImage}
            setSecondsPerImage={setSecondsPerImage}
            onAddFiles={handleDroppedFiles}
            onAddUrlSlot={addImageUrlSlot}
            onSetUrlAt={setImageUrlAt}
            onRemoveUrlAt={removeImageUrlAt}
            onRemoveFileAt={removeImageFileAt}
            onClearAll={resetMedia}
            disabled={busy}
          />
        )}
      </div>

      {/* Audio — only meaningful for posts (videos carry their own track) */}
      {mediaKind === "post" && imagesShownCount > 0 && (
        <div className="card p-4">
          <Field
            label="Audio (optional)"
            hint="Voiceover, music, or sound. Drives the audio + temporal/language regions."
          >
            <SourceTabs source={audioSource} onChange={setAudioSource} />
            <div className="mt-2">
              {audioSource === "upload" ? (
                <Dropzone
                  accept="audio/*"
                  maxBytes={MAX_AUDIO_BYTES}
                  disabled={busy}
                  onFile={(f) => setAudioFile(f)}
                  label={audioFile ? audioFile.name : "Drop an audio file"}
                  subtext="MP3 / WAV / M4A, up to 50 MB"
                />
              ) : (
                <input
                  type="url"
                  value={audioUrl}
                  onChange={(e) => setAudioUrl(e.target.value)}
                  placeholder="https://example.com/voiceover.m4a"
                  disabled={busy}
                  className="block w-full rounded-md border border-border bg-surface px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-soft"
                />
              )}
            </div>
          </Field>
        </div>
      )}

      {/* Caption — always present */}
      <div className="card p-4">
        <Field
          label={
            mediaKind === "video"
              ? "Caption (optional)"
              : "Caption (optional, recommended)"
          }
          hint={
            mediaKind === "video"
              ? "Written copy that accompanies the video — drives the language regions in addition to the dialog/voiceover."
              : "Drives the language + memory regions even when no audio is present."
          }
        >
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Treat yourself! Pepsi Cola Cream Soda is here to stay — now available in Regular and Zero Sugar."
            rows={3}
            maxLength={5000}
            disabled={busy}
            className="block w-full rounded-md border border-border bg-surface px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-soft"
          />
        </Field>
      </div>

      {/* Stage 3 universal fields */}
      <div className="card grid gap-4 p-4 sm:grid-cols-2">
        <Field label="Run title" hint="Optional. Shows up in the sidebar.">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Holiday teaser v3"
            disabled={busy}
            className="block w-full rounded-md border border-border bg-surface px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-soft"
          />
        </Field>
        <Field label="Campaign" hint="Optional. Group runs by ad-brief / launch.">
          <select
            value={campaignId ?? ""}
            onChange={(e) => setCampaignId(e.target.value || null)}
            disabled={busy}
            className="block w-full rounded-md border border-border bg-surface px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-soft"
          >
            <option value="">Uncategorized</option>
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>

        <div className="sm:col-span-2">
          <Field
            label="Additional context"
            hint="Brand, audience, tone, constraints — anything you'd tell a creative team. Steers the suggestion engine away from generic advice."
          >
            <textarea
              value={additionalContext}
              onChange={(e) => setAdditionalContext(e.target.value)}
              placeholder="Luxury skincare brand, female 30-45 audience, premium minimalist aesthetic. No price discounting language."
              disabled={busy}
              rows={3}
              className="block w-full rounded-md border border-border bg-surface px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-soft"
            />
          </Field>
        </div>
      </div>

      {/* Goal */}
      <div className="card p-4">
        <Field
          label="Goal"
          hint="Re-weights the same regions. Different goal → different overall."
        >
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {GOALS.map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGoal(g)}
                disabled={busy}
                className={`rounded-md border px-3 py-2 text-sm font-medium transition ${
                  goal === g
                    ? "border-accent bg-accent text-accent-foreground"
                    : "border-border bg-surface text-foreground-muted hover:border-border-strong hover:text-foreground"
                }`}
              >
                {GOAL_LABELS[g]}
              </button>
            ))}
          </div>
        </Field>
      </div>

      {error && (
        <div className="rounded-lg border border-poor/30 bg-poor-soft px-3 py-2 text-sm text-poor">
          {error}
        </div>
      )}

      <div className="flex items-center justify-end gap-3">
        {busy && stage && (
          <span className="text-xs text-foreground-muted">{stage}</span>
        )}
        <button
          type="submit"
          disabled={busy || !hasMedia}
          className="rounded-lg bg-accent px-6 py-2.5 text-sm font-medium text-accent-foreground transition hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {busy ? "Running…" : "Run BrainScore"}
        </button>
      </div>
    </form>
  );
}

// ---- Subsections -------------------------------------------------------

function EmptyMediaPicker({
  onFiles,
  videoUrl,
  setVideoUrl,
  onAddImageUrl,
  disabled,
}: {
  onFiles: (files: File[]) => void;
  videoUrl: string;
  setVideoUrl: (v: string) => void;
  onAddImageUrl: () => void;
  disabled: boolean;
}) {
  return (
    <div className="space-y-3">
      <Field
        label="Media"
        hint="Drop a video file (MP4) or up to 20 images (JPG/PNG/WebP). Cortyze auto-detects which mode you're in."
      >
        <Dropzone
          accept="video/*,image/jpeg,image/png,image/webp"
          multiple
          maxBytes={MAX_VIDEO_BYTES}
          disabled={disabled}
          onFiles={onFiles}
          onFile={(f) => onFiles([f])}
          label="Drop a video, or up to 20 images for a carousel"
          subtext="Video up to 200 MB · Images up to 25 MB each"
        />
      </Field>

      <details className="text-xs text-foreground-subtle">
        <summary className="cursor-pointer text-accent hover:text-accent-hover">
          Or paste a URL instead
        </summary>
        <div className="mt-2 space-y-2 rounded-md border border-border bg-surface-muted/40 p-3">
          <Field label="Video URL" hint="Direct .mp4 link. Switches to video mode.">
            <input
              type="url"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://example.com/clip.mp4"
              disabled={disabled}
              className="block w-full rounded-md border border-border bg-surface px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-soft"
            />
          </Field>
          <button
            type="button"
            onClick={onAddImageUrl}
            disabled={disabled}
            className="text-xs text-accent hover:text-accent-hover disabled:opacity-50"
          >
            + Paste an image URL (switches to post mode)
          </button>
        </div>
      </details>
    </div>
  );
}

function VideoSection({
  videoFile,
  videoUrl,
  setVideoUrl,
  onRemoveFile,
  onClearAll,
  disabled,
}: {
  videoFile: File | null;
  videoUrl: string;
  setVideoUrl: (v: string) => void;
  onRemoveFile: () => void;
  onClearAll: () => void;
  disabled: boolean;
}) {
  return (
    <Field
      label="Video"
      hint="Audio is taken from the video's own track. Add a caption below if there's accompanying copy."
    >
      <div className="space-y-2">
        {videoFile ? (
          <div className="flex items-center gap-3 rounded-lg border border-border bg-surface px-3 py-2 text-sm">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-accent-soft text-accent">
              <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
                <path d="M3 2v10l9-5z" fill="currentColor" />
              </svg>
            </span>
            <span className="flex-1 truncate text-foreground">{videoFile.name}</span>
            <button
              type="button"
              onClick={onRemoveFile}
              disabled={disabled}
              className="text-foreground-subtle hover:text-poor"
              aria-label="Remove video"
            >
              ✕
            </button>
          </div>
        ) : (
          <input
            type="url"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="https://example.com/clip.mp4"
            disabled={disabled}
            className="block w-full rounded-md border border-border bg-surface px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent-soft"
          />
        )}
        <button
          type="button"
          onClick={onClearAll}
          disabled={disabled}
          className="text-xs text-foreground-muted hover:text-foreground disabled:opacity-50"
        >
          ← Switch to images instead
        </button>
      </div>
    </Field>
  );
}

function PostSection({
  postImages,
  postImageUrls,
  secondsPerImage,
  setSecondsPerImage,
  onAddFiles,
  onAddUrlSlot,
  onSetUrlAt,
  onRemoveUrlAt,
  onRemoveFileAt,
  onClearAll,
  disabled,
}: {
  postImages: File[];
  postImageUrls: string[];
  secondsPerImage: number;
  setSecondsPerImage: (n: number) => void;
  onAddFiles: (files: File[]) => void;
  onAddUrlSlot: () => void;
  onSetUrlAt: (i: number, v: string) => void;
  onRemoveUrlAt: (i: number) => void;
  onRemoveFileAt: (i: number) => void;
  onClearAll: () => void;
  disabled: boolean;
}) {
  const total = postImages.length + postImageUrls.length;
  const remaining = Math.max(0, 20 - total);
  return (
    <div className="space-y-3">
      <Field
        label={`Images · ${total} / 20`}
        hint={
          total >= 2
            ? "Carousel mode — each image held for the duration below."
            : "Add up to 20. Two or more become a carousel."
        }
      >
        {remaining > 0 && (
          <Dropzone
            accept="image/jpeg,image/png,image/webp"
            multiple
            maxBytes={MAX_IMAGE_BYTES}
            disabled={disabled}
            onFiles={(files) => onAddFiles(files)}
            onFile={(f) => onAddFiles([f])}
            label={
              total === 0
                ? "Drop images (or click)"
                : `Add more images · ${remaining} slot(s) left`
            }
            subtext="JPG / PNG / WebP, up to 25 MB each"
          />
        )}

        {postImages.length > 0 && (
          <ul className="mt-2 space-y-1 text-xs">
            {postImages.map((f, i) => (
              <li
                key={`${f.name}-${i}`}
                className="flex items-center gap-2 rounded-md border border-border bg-surface px-2 py-1"
              >
                <span className="text-foreground-subtle tabular-nums">
                  {i + 1}.
                </span>
                <span className="flex-1 truncate text-foreground-muted">
                  {f.name}
                </span>
                <button
                  type="button"
                  onClick={() => onRemoveFileAt(i)}
                  disabled={disabled}
                  className="text-foreground-subtle hover:text-poor"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}

        {postImageUrls.length > 0 && (
          <ul className="mt-2 space-y-1">
            {postImageUrls.map((u, i) => (
              <li key={i} className="flex items-center gap-2">
                <input
                  type="url"
                  value={u}
                  onChange={(e) => onSetUrlAt(i, e.target.value)}
                  placeholder="https://example.com/img.jpg"
                  disabled={disabled}
                  className="flex-1 rounded-md border border-border bg-surface px-2 py-1 text-xs focus:border-accent focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => onRemoveUrlAt(i)}
                  disabled={disabled}
                  className="text-foreground-subtle hover:text-poor"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-2 flex items-center justify-between">
          <button
            type="button"
            onClick={onAddUrlSlot}
            disabled={disabled || total >= 20}
            className="text-xs text-accent hover:text-accent-hover disabled:opacity-50"
          >
            + Paste an image URL
          </button>
          <button
            type="button"
            onClick={onClearAll}
            disabled={disabled}
            className="text-xs text-foreground-muted hover:text-foreground disabled:opacity-50"
          >
            ← Switch to a video instead
          </button>
        </div>
      </Field>

      {total >= 2 && (
        <Field
          label="Seconds per image"
          hint="How long each image is held in the synthesized video."
        >
          <input
            type="number"
            min={0.5}
            max={10}
            step={0.5}
            value={secondsPerImage}
            onChange={(e) => setSecondsPerImage(parseFloat(e.target.value))}
            disabled={disabled}
            className="block w-32 rounded-md border border-border bg-surface px-3 py-1.5 text-sm focus:border-accent focus:outline-none"
          />
        </Field>
      )}
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-foreground">{label}</span>
      {children}
      {hint && <span className="text-xs text-foreground-subtle">{hint}</span>}
    </label>
  );
}

function SourceTabs({
  source,
  onChange,
}: {
  source: "upload" | "url";
  onChange: (s: "upload" | "url") => void;
}) {
  return (
    <div className="flex items-center gap-1 text-xs">
      <button
        type="button"
        onClick={() => onChange("upload")}
        className={`rounded-md px-2 py-1 ${
          source === "upload"
            ? "bg-accent-soft text-accent"
            : "text-foreground-muted hover:text-foreground"
        }`}
      >
        Upload
      </button>
      <button
        type="button"
        onClick={() => onChange("url")}
        className={`rounded-md px-2 py-1 ${
          source === "url"
            ? "bg-accent-soft text-accent"
            : "text-foreground-muted hover:text-foreground"
        }`}
      >
        Paste URL
      </button>
    </div>
  );
}

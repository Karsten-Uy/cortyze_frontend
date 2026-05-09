"use client";

import { useRef, useState, type CSSProperties } from "react";

import { GOAL_OPTIONS } from "@/lib/cortyze-data";
import { mintUploadUrl, uploadFileToR2, type GoalKey } from "@/lib/api";

// Form input passed up to the page on submit. `media.url` is a
// presigned R2 GET URL the GPU worker can fetch; populated only after
// a successful upload.
export type LabBenchInput = {
  name: string;
  goal: GoalKey;
  brief: string;
  caption: string;
  media: MediaFile | null;
};

export type MediaFile = {
  name: string;
  kind: "Video" | "Image";
  size: string;
  url: string;
  // R2 object key; round-tripped to /runs so the API can re-presign
  // a fresh `media_url` after the original presigned URL TTL elapses.
  objectKey: string;
};

// Mirrors the backend's allowlist in api/routes/upload.py.
const ACCEPT_MIMES =
  "video/mp4,video/quicktime,video/webm,video/x-m4v,image/jpeg,image/png,image/webp";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function inferKind(mime: string): "Video" | "Image" {
  return mime.startsWith("video/") ? "Video" : "Image";
}

// Subset of LabBenchInput suitable for pre-filling the form when the
// user clicks "Edit & re-score" on the Results page. `media` carries
// over the previous run's R2 object so the user can resubmit without
// re-uploading; the underlying object lives 7 days (R2 lifecycle) and
// the API re-presigns the URL on every /runs/:id read.
export type LabBenchInitialValues = {
  name?: string;
  goal?: GoalKey;
  brief?: string;
  caption?: string;
  media?: MediaFile | null;
};

export function LabBench({
  onRun,
  initialError = null,
  initialValues,
}: {
  onRun: (input: LabBenchInput) => Promise<void> | void;
  initialError?: string | null;
  initialValues?: LabBenchInitialValues | null;
}) {
  const [name, setName] = useState(initialValues?.name ?? "");
  const [goalKey, setGoalKey] = useState<GoalKey>(
    initialValues?.goal ?? GOAL_OPTIONS[0].key,
  );
  const [brief, setBrief] = useState(initialValues?.brief ?? "");
  const [caption, setCaption] = useState(initialValues?.caption ?? "");
  const [media, setMedia] = useState<MediaFile | null>(
    initialValues?.media ?? null,
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(initialError);

  async function handleSubmit() {
    setError(null);
    if (!media) {
      setError("Upload media before running analysis.");
      return;
    }
    setSubmitting(true);
    try {
      await onRun({ name, goal: goalKey, brief, caption, media });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start run");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fade-in"
      style={{
        flex: 1,
        overflowY: "auto",
        display: "flex",
        // `safe center` keeps the form vertically centered when there's
        // room, but falls back to top-aligned (and scrollable from the
        // top) when the viewport is shorter than the form. Plain
        // `center` would push the form's top off-screen above the
        // scroll origin on short viewports.
        alignItems: "safe center",
        justifyContent: "center",
        padding: "40px 28px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 560,
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        <div style={{ marginBottom: 4 }}>
          <h1
            className="serif"
            style={{
              margin: 0,
              fontSize: 28,
              fontWeight: 500,
              color: "var(--ink)",
              letterSpacing: "-0.01em",
            }}
          >
            New analysis
          </h1>
          <div
            style={{ marginTop: 6, fontSize: 13, color: "var(--ink-3)" }}
          >
            Tell us about the campaign and we&apos;ll score it across six cognitive dimensions.
          </div>
        </div>

        <Field label="Campaign name">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Canon spring reel"
            style={inputStyle}
            disabled={submitting}
          />
        </Field>

        <Field label="What are you optimizing for?">
          <div style={{ position: "relative" }}>
            <select
              value={goalKey}
              onChange={(e) => setGoalKey(e.target.value as GoalKey)}
              style={{ ...inputStyle, appearance: "none", paddingRight: 32 }}
              disabled={submitting}
            >
              {GOAL_OPTIONS.map((g) => (
                <option key={g.key} value={g.key}>
                  {g.display}
                </option>
              ))}
            </select>
            <span
              style={{
                position: "absolute",
                right: 14,
                top: "50%",
                transform: "translateY(-50%)",
                pointerEvents: "none",
                fontSize: 10,
                color: "var(--ink-3)",
              }}
            >
              ▾
            </span>
          </div>
        </Field>

        <Field label="Brief" sublabel="What's this campaign about?">
          <textarea
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
            placeholder="Describe your campaign goals, target audience, key message…"
            rows={4}
            style={{ ...inputStyle, lineHeight: 1.5 }}
            disabled={submitting}
          />
        </Field>

        <Field label="Caption / copy">
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Paste the ad copy or caption that will accompany this creative"
            rows={3}
            style={{ ...inputStyle, lineHeight: 1.5 }}
            disabled={submitting}
          />
        </Field>

        <Field label="Media">
          <MediaDropper media={media} setMedia={setMedia} disabled={submitting} />
        </Field>

        {error && (
          <div
            style={{
              fontSize: 12,
              color: "var(--red)",
              background: "var(--red-tint)",
              border: "0.5px solid rgba(163,45,45,0.2)",
              borderRadius: 8,
              padding: "10px 12px",
            }}
          >
            {error}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={submitting || !media}
          style={{
            width: "100%",
            background: submitting || !media ? "var(--coral-2)" : "var(--coral)",
            color: "#fff",
            border: "none",
            borderRadius: 12,
            padding: 14,
            fontSize: 14,
            fontWeight: 500,
            marginTop: 4,
            transition: "background 150ms",
            cursor: submitting ? "wait" : !media ? "not-allowed" : "pointer",
            opacity: submitting ? 0.8 : !media ? 0.5 : 1,
          }}
          onMouseEnter={(e) => {
            if (!submitting && media) e.currentTarget.style.background = "var(--coral-2)";
          }}
          onMouseLeave={(e) => {
            if (!submitting && media) e.currentTarget.style.background = "var(--coral)";
          }}
        >
          {submitting ? "Starting analysis…" : "Run analysis"}
        </button>
      </div>
    </div>
  );
}

function Field({
  label,
  sublabel,
  children,
}: {
  label: string;
  sublabel?: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 500, color: "var(--ink)" }}>
          {label}
        </span>
        {sublabel && (
          <span style={{ fontSize: 11, color: "var(--ink-3)" }}>{sublabel}</span>
        )}
      </label>
      {children}
    </div>
  );
}

const inputStyle: CSSProperties = {
  width: "100%",
  background: "#ffffff",
  border: "0.5px solid rgba(0,0,0,0.1)",
  borderRadius: 10,
  padding: "12px 14px",
  fontSize: 13,
  color: "var(--ink)",
  outline: "none",
  fontFamily: "inherit",
};

function MediaDropper({
  media,
  setMedia,
  disabled,
}: {
  media: MediaFile | null;
  setMedia: (m: MediaFile | null) => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [hover, setHover] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0); // 0..1
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setError(null);
    setUploading(true);
    setProgress(0);
    try {
      // Pre-flight: backend allowlist mirrors browser's `accept`
      // attribute, but a user can still drop a non-matching file via
      // drag-drop. Catch it before round-tripping to the API.
      if (!ACCEPT_MIMES.split(",").includes(file.type)) {
        throw new Error(`Unsupported file type: ${file.type || "unknown"}`);
      }
      if (file.size > 100 * 1024 * 1024) {
        throw new Error(
          `File too large (${formatBytes(file.size)}). Max is 100 MB.`,
        );
      }

      const minted = await mintUploadUrl({
        name: file.name,
        type: file.type,
        size: file.size,
      });

      await uploadFileToR2(minted.put_url, file, (loaded, total) => {
        setProgress(total > 0 ? loaded / total : 0);
      });

      setMedia({
        name: file.name,
        kind: inferKind(file.type),
        size: formatBytes(file.size),
        url: minted.get_url,
        objectKey: minted.object_key,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      setProgress(0);
    }
  }

  if (media) {
    return (
      <div
        style={{
          background: "#fff",
          border: "0.5px solid rgba(0,0,0,0.1)",
          borderRadius: 10,
          padding: 14,
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 8,
            background: "#D9D5CE",
            display: "grid",
            placeItems: "center",
            flexShrink: 0,
          }}
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#888"
            strokeWidth="1.5"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="9" cy="9" r="2" />
            <path d="M21 15l-5-5L5 21" />
          </svg>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 500,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {media.name}
          </div>
          <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 2 }}>
            {media.kind} · {media.size} · uploaded
          </div>
        </div>
        <button
          onClick={() => setMedia(null)}
          disabled={disabled}
          style={{
            fontSize: 11,
            padding: "5px 10px",
            borderRadius: 8,
            border: "0.5px solid rgba(0,0,0,0.1)",
            background: "transparent",
            color: "var(--ink-2)",
            cursor: disabled ? "not-allowed" : "pointer",
          }}
        >
          Remove
        </button>
      </div>
    );
  }

  const isInteractive = !disabled && !uploading;

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT_MIMES}
        style={{ display: "none" }}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          // Reset so picking the same file twice still triggers onChange.
          e.target.value = "";
        }}
      />
      <div
        onClick={() => {
          if (isInteractive) inputRef.current?.click();
        }}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onDragOver={(e) => {
          if (!isInteractive) return;
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => {
          if (!isInteractive) return;
          e.preventDefault();
          setDragActive(false);
          const f = e.dataTransfer.files?.[0];
          if (f) handleFile(f);
        }}
        style={{
          border:
            "2px dashed " +
            (dragActive || hover
              ? "rgba(212,97,62,0.4)"
              : "rgba(0,0,0,0.12)"),
          borderRadius: 12,
          padding: "32px 16px",
          textAlign: "center",
          background:
            dragActive || hover ? "rgba(212,97,62,0.03)" : "transparent",
          transition: "all 150ms",
          cursor: isInteractive ? "pointer" : "not-allowed",
          opacity: disabled ? 0.6 : 1,
        }}
      >
        <div
          style={{
            margin: "0 auto 10px",
            width: 36,
            height: 36,
            display: "grid",
            placeItems: "center",
            color: "var(--ink-3)",
          }}
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path d="M12 19V5M5 12l7-7 7 7" />
          </svg>
        </div>
        <div style={{ fontSize: 13, color: "var(--ink)", fontWeight: 500 }}>
          {uploading
            ? `Uploading… ${Math.round(progress * 100)}%`
            : "Drop a video or image, or click to browse"}
        </div>
        <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 4 }}>
          MP4, MOV, WebM, JPG, PNG, WebP — up to 100 MB
        </div>

        {uploading && (
          <div
            style={{
              margin: "12px auto 0",
              width: "60%",
              height: 3,
              background: "rgba(0,0,0,0.06)",
              borderRadius: 2,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${Math.round(progress * 100)}%`,
                background: "var(--coral)",
                transition: "width 150ms ease",
              }}
            />
          </div>
        )}
      </div>

      {error && (
        <div
          style={{
            marginTop: 8,
            fontSize: 12,
            color: "var(--red)",
            background: "var(--red-tint)",
            border: "0.5px solid rgba(163,45,45,0.2)",
            borderRadius: 8,
            padding: "8px 12px",
          }}
        >
          {error}
        </div>
      )}
    </>
  );
}

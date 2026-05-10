"use client";

import { useEffect, useState, type CSSProperties } from "react";

import { GOAL_OPTIONS } from "@/lib/cortyze-data";
import {
  listDemos,
  type DemoSummary,
  type GoalKey,
} from "@/lib/api";

// Form input passed up to the page on submit. `media.url` is a
// presigned R2 GET URL the GPU worker can fetch; populated only after
// a successful upload. `demoId` is set when the user clicked a "Try
// a sample" card — the backend bypasses the real pipeline and returns
// the canned plan from data/demo_runs/<demo_id>.json.
export type LabBenchInput = {
  name: string;
  goal: GoalKey;
  brief: string;
  caption: string;
  media: MediaFile | null;
  demoId?: string | null;
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

// Subset of LabBenchInput suitable for pre-filling the form when the
// user clicks "Edit & re-score" on the Results page. `media` carries
// over the previous run's R2 object so the user can resubmit without
// re-uploading; the underlying object lives 7 days (R2 lifecycle) and
// the API re-presigns the URL on every /runs/:id read. `demoId` keeps
// the canned-sample selection consistent across an Edit & re-score
// round-trip in the demo build.
export type LabBenchInitialValues = {
  name?: string;
  goal?: GoalKey;
  brief?: string;
  caption?: string;
  media?: MediaFile | null;
  demoId?: string | null;
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
  // "Try a sample" — populated on mount from GET /demos. When the user
  // clicks a card, `selectedDemo` holds the chosen one; the form fields
  // get pre-filled from `demo.form_defaults` and `media` is bypassed
  // (backend short-circuits the pipeline using `demo_id`).
  const [demos, setDemos] = useState<DemoSummary[]>([]);
  const [selectedDemo, setSelectedDemo] = useState<DemoSummary | null>(null);

  useEffect(() => {
    let cancelled = false;
    listDemos()
      .then((list) => {
        if (cancelled) return;
        setDemos(list);
        // Demo build: file uploads are disabled, so the form needs a
        // sample selected to be runnable. If `initialValues.demoId` is
        // set (e.g. Edit & re-score round-trip), restore that exact
        // sample; otherwise auto-select the first one so the Run
        // button is usable on first paint.
        const auto = initialValues?.demoId
          ? list.find((d) => d.demo_id === initialValues.demoId) ?? list[0]
          : list[0];
        if (!auto) return;
        setSelectedDemo((current) => current ?? auto);
        // Auto-pre-fill the form with the chosen demo's defaults
        // UNLESS this is an Edit & re-score round-trip (in which case
        // initialValues already carries the previous run's content
        // and we shouldn't clobber it).
        const isEditRoundTrip = Boolean(
          initialValues?.name ||
            initialValues?.brief ||
            initialValues?.caption,
        );
        if (!isEditRoundTrip) {
          setName(auto.form_defaults.name);
          setGoalKey(auto.form_defaults.goal);
          setBrief(auto.form_defaults.brief);
          setCaption(auto.form_defaults.caption);
        }
      })
      .catch(() => {
        // Demos are optional. If /demos fails, we just hide the row.
      });
    return () => {
      cancelled = true;
    };
    // initialValues is read once at mount; subsequent changes
    // shouldn't blow away a user's manual edits.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSelectDemo(demo: DemoSummary) {
    setSelectedDemo(demo);
    setName(demo.form_defaults.name);
    setGoalKey(demo.form_defaults.goal);
    setBrief(demo.form_defaults.brief);
    setCaption(demo.form_defaults.caption);
    setMedia(null);
    setError(null);
  }

  async function handleSubmit() {
    setError(null);
    if (!selectedDemo && !media) {
      setError("Upload media or pick a sample before running analysis.");
      return;
    }
    setSubmitting(true);
    try {
      await onRun({
        name,
        goal: goalKey,
        brief,
        caption,
        media: selectedDemo ? null : media,
        demoId: selectedDemo?.demo_id ?? null,
      });
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

        {demos.length > 0 && (
          <DemoSamplesRow
            demos={demos}
            selectedId={selectedDemo?.demo_id ?? null}
            onSelect={handleSelectDemo}
            disabled={submitting}
          />
        )}

        <Field label="Campaign name">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Canon spring reel"
            style={inputStyle}
            disabled={submitting}
          />
        </Field>

        <Field label="Optimizing for">
          {/* Read-only in the demo build: each sample is paired with
              a fixed goal that drives its suggestions. Surfacing it
              as a coral badge instead of a dropdown signals "this is
              part of the sample, not your choice." */}
          <div
            style={{
              ...inputStyle,
              display: "flex",
              alignItems: "center",
              gap: 10,
              color: "var(--ink)",
            }}
          >
            <span
              style={{
                display: "inline-block",
                fontSize: 10,
                fontWeight: 500,
                letterSpacing: "0.3px",
                textTransform: "uppercase",
                padding: "3px 10px",
                borderRadius: 20,
                background: "var(--coral-tint)",
                color: "var(--coral)",
              }}
            >
              {GOAL_OPTIONS.find((g) => g.key === goalKey)?.display ?? goalKey}
            </span>
            <span style={{ fontSize: 11, color: "var(--ink-3)" }}>
              chosen for this sample
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

        <RunButton
          submitting={submitting}
          ready={Boolean(selectedDemo) || Boolean(media)}
          onClick={handleSubmit}
        />
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


function DemoSampleThumbnail({
  url,
  thumbnail,
  label,
}: {
  url: string | null;
  thumbnail: string;
  label: string;
}) {
  const tile = (
    <div
      style={{
        position: "relative",
        width: "100%",
        aspectRatio: "16/9",
        background: `#000 url(${thumbnail}) center/cover no-repeat`,
      }}
    >
      {url && (
        <div
          aria-hidden="true"
          className="cortyze-media-overlay"
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.18)",
            opacity: 0,
            transition: "opacity 150ms",
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.92)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--ink)",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
              <path d="M3 2l9 5-9 5z" />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
  if (!url) return tile;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Open ${label} on YouTube in a new tab`}
      className="cortyze-media-link"
      style={{ display: "block", textDecoration: "none" }}
    >
      {tile}
    </a>
  );
}

function DemoSamplesRow({
  demos,
  selectedId,
  onSelect,
  disabled,
}: {
  demos: DemoSummary[];
  selectedId: string | null;
  onSelect: (demo: DemoSummary) => void;
  disabled: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        background: "var(--sand)",
        borderRadius: 12,
        padding: 14,
      }}
    >
      <div className="caption">Pick a sample</div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${demos.length}, minmax(0, 1fr))`,
          gap: 10,
        }}
      >
        {demos.map((d) => {
          const active = selectedId === d.demo_id;
          // Card is now a non-interactive container so we can split
          // the click target: the thumbnail opens YouTube in a new tab,
          // the text-block selects the sample. Stacking <a> + <button>
          // is the only way to get separate click targets without
          // nesting interactive elements (HTML invalid).
          return (
            <div
              key={d.demo_id}
              style={{
                background: active ? "rgba(212,97,62,0.08)" : "#fff",
                border: active
                  ? "1px solid var(--coral)"
                  : "0.5px solid rgba(0,0,0,0.1)",
                borderRadius: 10,
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                transition: "border-color 150ms, background 150ms",
              }}
            >
              <DemoSampleThumbnail
                url={d.media_url}
                thumbnail={d.thumbnail_url}
                label={d.label}
              />
              <button
                onClick={() => onSelect(d)}
                disabled={disabled}
                style={{
                  textAlign: "left",
                  background: "transparent",
                  border: "none",
                  padding: "8px 10px 10px",
                  cursor: disabled ? "not-allowed" : "pointer",
                  width: "100%",
                  font: "inherit",
                  color: "inherit",
                }}
              >
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 500,
                    color: "var(--ink)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {d.label}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    color: "var(--ink-3)",
                    marginTop: 2,
                    lineHeight: 1.35,
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {d.tagline}
                </div>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}


function RunButton({
  submitting,
  ready,
  onClick,
}: {
  submitting: boolean;
  ready: boolean;
  onClick: () => void;
}) {
  const disabled = submitting || !ready;
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: "100%",
        background: disabled ? "var(--coral-2)" : "var(--coral)",
        color: "#fff",
        border: "none",
        borderRadius: 12,
        padding: 14,
        fontSize: 14,
        fontWeight: 500,
        marginTop: 4,
        transition: "background 150ms",
        cursor: submitting ? "wait" : !ready ? "not-allowed" : "pointer",
        opacity: submitting ? 0.8 : !ready ? 0.5 : 1,
      }}
      onMouseEnter={(e) => {
        if (!disabled) e.currentTarget.style.background = "var(--coral-2)";
      }}
      onMouseLeave={(e) => {
        if (!disabled) e.currentTarget.style.background = "var(--coral)";
      }}
    >
      {submitting ? "Starting analysis…" : "Run analysis"}
    </button>
  );
}

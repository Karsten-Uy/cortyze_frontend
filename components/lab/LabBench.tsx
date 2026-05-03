"use client";

import { useState, type CSSProperties } from "react";

import { I } from "./Icons";
import { LAB_GOALS, type LabCampaign, type LabGoal } from "@/lib/lab/data";

type Media = { kind: string; name: string; size: string; duration: string } | null;
type RunState = "idle" | "running" | "done";

const inputStyle: CSSProperties = {
  width: "100%",
  background: "#FBFBF9",
  border: "1px solid var(--rule)",
  padding: "9px 12px",
  fontSize: 13,
  color: "var(--ink)",
  borderRadius: 0,
};

const selectStyle: CSSProperties = {
  ...inputStyle,
  appearance: "none",
  backgroundImage:
    "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 10 10'><path d='M2 4l3 3 3-3' stroke='%231A1A1B' stroke-width='1' fill='none'/></svg>\")",
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 10px center",
  paddingRight: 26,
};

const composerIconBtn: CSSProperties = {
  width: 32,
  height: 32,
  display: "grid",
  placeItems: "center",
  background: "transparent",
  border: "1px solid var(--rule)",
  borderRadius: 999,
  color: "var(--ink-2)",
  cursor: "pointer",
};

const chipBtn: CSSProperties = {
  fontSize: 12,
  padding: "7px 14px",
  border: "1px solid var(--rule)",
  background: "var(--paper)",
  color: "var(--ink-2)",
  borderRadius: 999,
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
};

const pillBtn: CSSProperties = {
  fontSize: 10,
  padding: "3px 8px",
  border: "1px solid var(--rule)",
  background: "transparent",
  color: "var(--ink-2)",
  fontFamily: "var(--font-jbm)",
  letterSpacing: "0.02em",
};

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
    <div style={{ marginTop: 14 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: 6,
        }}
      >
        <label
          className="lab-mono"
          style={{
            fontSize: 9,
            letterSpacing: "0.12em",
            color: "var(--ink-2)",
            textTransform: "uppercase",
          }}
        >
          {label}
        </label>
        {hint && <span style={{ fontSize: 10, color: "var(--ink-4)" }}>{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function MediaDropper({
  media,
  setMedia,
}: {
  media: Media;
  setMedia: (m: Media) => void;
}) {
  const [hover, setHover] = useState(false);
  if (media) {
    return (
      <div
        style={{
          border: "1px solid var(--rule)",
          background: "#FBFBF9",
          padding: 14,
          display: "flex",
          alignItems: "center",
          gap: 14,
        }}
      >
        <div
          style={{
            width: 120,
            height: 68,
            background: "#F2F1EC",
            border: "1px solid var(--rule)",
            position: "relative",
            flexShrink: 0,
            overflow: "hidden",
          }}
        >
          <div style={{ display: "flex", height: "100%" }}>
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  background: ["#D4D2CC", "#C8C5BC", "#BAB6AB", "#A89F8E", "#8E8270"][i],
                  borderRight: i < 4 ? "1px solid #FBFBF9" : "none",
                }}
              />
            ))}
          </div>
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              height: 2,
              width: "40%",
              background: "var(--teal)",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: 4,
              left: 4,
              fontFamily: "var(--font-jbm)",
              fontSize: 8,
              color: "#F9F9F7",
              background: "rgba(26,26,27,0.65)",
              padding: "1px 4px",
            }}
          >
            0:12 / {media.duration}
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 500 }}>{media.name}</div>
          <div className="lab-mono" style={{ fontSize: 10, color: "var(--ink-3)", marginTop: 2 }}>
            VIDEO · MP4 · {media.duration} · {media.size}
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <button style={pillBtn}>Preview</button>
            <button style={pillBtn} onClick={() => setMedia(null)}>
              Remove
            </button>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div>
      <div
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onClick={() =>
          setMedia({ kind: "image", name: "reset-ritual-v3.mp4", size: "14.2 MB", duration: "0:30" })
        }
        style={{
          background: "#1A1A1B",
          border: "1.5px dashed " + (hover ? "#7A7B80" : "rgba(249,249,247,0.18)"),
          padding: "40px 18px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          cursor: "pointer",
          transition: "border-color 150ms",
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            display: "grid",
            placeItems: "center",
            color: "#F9F9F7",
            opacity: 0.7,
          }}
        >
          <I.Upload size={20} />
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 14, color: "#F9F9F7", fontWeight: 500 }}>
            Drop a video, or up to 20 images for a carousel
          </div>
          <div
            className="lab-mono"
            style={{ fontSize: 10, color: "rgba(249,249,247,0.5)", marginTop: 4 }}
          >
            VIDEO ≤ 200 MB · IMAGES ≤ 25 MB EACH
          </div>
        </div>
      </div>
      <button
        style={{
          marginTop: 8,
          fontSize: 11,
          color: "var(--teal-2)",
          background: "transparent",
          border: "none",
          padding: 0,
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <I.Chevron size={9} /> Or paste a URL instead
      </button>
    </div>
  );
}

function RunRow({ onRun, runState }: { onRun: () => void; runState: RunState }) {
  return (
    <div
      style={{
        marginTop: 22,
        paddingTop: 16,
        borderTop: "1px solid var(--rule)",
        display: "flex",
        alignItems: "center",
        gap: 16,
      }}
    >
      <div className="lab-mono" style={{ fontSize: 10, color: "var(--ink-3)" }}>
        ~14 SEC · TRIBE-V2
      </div>
      <div style={{ flex: 1 }} />
      <button
        onClick={onRun}
        disabled={runState === "running"}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          background: runState === "running" ? "var(--ink-2)" : "#1A1A1B",
          color: "#F9F9F7",
          padding: "11px 18px",
          border: "1px solid #1A1A1B",
          fontSize: 13,
          fontWeight: 500,
        }}
      >
        {runState === "running" ? (
          <>
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                border: "1.5px solid #F9F9F7",
                borderTopColor: "transparent",
                animation: "labSpin 0.7s linear infinite",
              }}
            />
            Running…
          </>
        ) : (
          <>
            Run analysis
            <span className="lab-mono" style={{ fontSize: 10, opacity: 0.6, marginLeft: 4 }}>
              ⌘↵
            </span>
          </>
        )}
      </button>
    </div>
  );
}

export function LabBench({
  onRun,
  campaign,
  runState,
  embedded,
}: {
  onRun: (payload: {
    media: Media;
    goal: LabGoal;
    context: string;
    caption: string;
  }) => void;
  campaign: LabCampaign;
  runState: RunState;
  embedded?: boolean;
}) {
  const [context, setContext] = useState(
    "Q3 launch awareness for our morning reset serum. Audience is 28–45 urban wellness; tone rigorous, not woo-woo.",
  );
  const [caption, setCaption] = useState(
    "Mornings, recalibrated. Our reset serum, now in three new finishes.",
  );
  const [media, setMedia] = useState<Media>({
    kind: "image",
    name: "reset-ritual-v3.mp4",
    size: "14.2 MB",
    duration: "0:30",
  });
  const [goal, setGoal] = useState<LabGoal>("Brand Recall");

  if (embedded) {
    return (
      <div style={{ padding: "20px 28px 24px", animation: "labFadeIn 280ms ease" }}>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          <div
            className="lab-mono"
            style={{
              fontSize: 10,
              letterSpacing: "0.18em",
              color: "var(--ink-3)",
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 14,
            }}
          >
            <span style={{ width: 18, height: 1, background: "var(--ink-3)" }} />
            INPUTS · EDIT TO RE-RUN
          </div>

          <Field label="Goal of analysis" hint="Re-weights region scores">
            <select
              value={goal}
              onChange={(e) => setGoal(e.target.value as LabGoal)}
              style={selectStyle}
            >
              {LAB_GOALS.map((g) => (
                <option key={g}>{g}</option>
              ))}
            </select>
          </Field>

          <Field label="Brief" hint="Treated as creative context">
            <textarea
              value={context}
              onChange={(e) => setContext(e.target.value)}
              style={{
                ...inputStyle,
                minHeight: 60,
                padding: "10px 12px",
                fontFamily: "inherit",
                resize: "vertical",
                lineHeight: 1.5,
              }}
            />
          </Field>

          <Field label="Caption" hint="Copy that runs with the creative">
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              style={{
                ...inputStyle,
                minHeight: 50,
                padding: "10px 12px",
                fontFamily: "inherit",
                resize: "vertical",
                lineHeight: 1.5,
              }}
            />
          </Field>

          <Field label="Media">
            <MediaDropper media={media} setMedia={setMedia} />
          </Field>

          <RunRow
            onRun={() => onRun({ media, goal, context, caption })}
            runState={runState}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        flex: 1,
        overflowY: "auto",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 28px",
        animation: "labFadeIn 280ms ease",
      }}
    >
      <div style={{ width: "100%", maxWidth: 720 }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div
            style={{
              fontSize: 13,
              color: "var(--ink-3)",
              marginBottom: 6,
              fontWeight: 400,
            }}
          >
            Hi {campaign.owner || "Maya"}
          </div>
          <h1
            className="lab-serif"
            style={{
              margin: 0,
              fontSize: 36,
              fontWeight: 400,
              letterSpacing: "-0.02em",
              lineHeight: 1.1,
              color: "var(--ink)",
            }}
          >
            What ad goes{" "}
            <span style={{ fontStyle: "italic", color: "var(--ink-2)" }}>under the scope?</span>
          </h1>
        </div>

        <div
          style={{
            background: "#FBFBF9",
            border: "1px solid var(--rule)",
            borderRadius: 14,
            padding: "14px 14px 10px",
            boxShadow: "0 1px 0 rgba(26,26,27,0.04)",
          }}
        >
          <textarea
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="Tell Cortyze about the campaign — goal, audience, tone…"
            style={{
              width: "100%",
              minHeight: 64,
              padding: "8px 10px 4px",
              border: "none",
              outline: "none",
              resize: "none",
              background: "transparent",
              fontFamily: "inherit",
              fontSize: 14,
              lineHeight: 1.5,
              color: "var(--ink)",
            }}
          />

          <div style={{ borderTop: "1px dashed var(--rule)", marginTop: 6, paddingTop: 6 }}>
            <div
              className="lab-mono"
              style={{
                fontSize: 9,
                letterSpacing: "0.12em",
                color: "var(--ink-3)",
                padding: "0 10px",
                marginBottom: 2,
              }}
            >
              CAPTION
            </div>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Optional caption that runs with the creative…"
              style={{
                width: "100%",
                minHeight: 36,
                padding: "4px 10px 8px",
                border: "none",
                outline: "none",
                resize: "none",
                background: "transparent",
                fontFamily: "inherit",
                fontSize: 13,
                lineHeight: 1.5,
                color: "var(--ink-2)",
              }}
            />
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "6px 6px 4px",
              borderTop: "1px solid var(--rule)",
              marginTop: 4,
            }}
          >
            <button
              onClick={() => {
                if (!media)
                  setMedia({
                    kind: "image",
                    name: "reset-ritual-v3.mp4",
                    size: "14.2 MB",
                    duration: "0:30",
                  });
              }}
              style={composerIconBtn}
              title="Attach media"
            >
              <I.Upload size={14} />
            </button>

            <div style={{ position: "relative" }}>
              <select
                value={goal}
                onChange={(e) => setGoal(e.target.value as LabGoal)}
                style={{
                  appearance: "none",
                  background: "transparent",
                  border: "1px solid var(--rule)",
                  borderRadius: 999,
                  padding: "5px 26px 5px 10px",
                  fontSize: 11,
                  fontFamily: "var(--font-jbm)",
                  letterSpacing: "0.04em",
                  color: "var(--ink-2)",
                  cursor: "pointer",
                }}
              >
                {LAB_GOALS.map((g) => (
                  <option key={g}>{g}</option>
                ))}
              </select>
              <span
                style={{
                  position: "absolute",
                  right: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                  pointerEvents: "none",
                  fontSize: 9,
                  color: "var(--ink-3)",
                }}
              >
                ▾
              </span>
            </div>

            <div className="lab-mono" style={{ fontSize: 10, color: "var(--ink-3)", whiteSpace: "nowrap" }}>
              ~14 SEC
            </div>

            <div style={{ flex: 1 }} />

            <button
              onClick={() => onRun({ media, goal, context, caption })}
              disabled={runState === "running"}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: runState === "running" ? "var(--ink-2)" : "#1A1A1B",
                color: "#F9F9F7",
                padding: "8px 14px",
                border: "1px solid #1A1A1B",
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 500,
                cursor: runState === "running" ? "default" : "pointer",
              }}
            >
              {runState === "running" ? (
                <>
                  <span
                    style={{
                      width: 9,
                      height: 9,
                      borderRadius: "50%",
                      border: "1.5px solid #F9F9F7",
                      borderTopColor: "transparent",
                      animation: "labSpin 0.7s linear infinite",
                    }}
                  />
                  Running…
                </>
              ) : (
                <>
                  Run analysis
                  <span className="lab-mono" style={{ fontSize: 9, opacity: 0.6 }}>
                    ⌘↵
                  </span>
                </>
              )}
            </button>
          </div>

          {media && (
            <div
              style={{
                marginTop: 8,
                borderTop: "1px solid var(--rule)",
                paddingTop: 10,
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <div
                style={{
                  width: 80,
                  height: 46,
                  background: "#F2F1EC",
                  border: "1px solid var(--rule)",
                  position: "relative",
                  flexShrink: 0,
                  overflow: "hidden",
                  borderRadius: 4,
                }}
              >
                <div style={{ display: "flex", height: "100%" }}>
                  {[0, 1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      style={{
                        flex: 1,
                        background: ["#D4D2CC", "#C8C5BC", "#BAB6AB", "#A89F8E", "#8E8270"][i],
                        borderRight: i < 4 ? "1px solid #FBFBF9" : "none",
                      }}
                    />
                  ))}
                </div>
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 500 }}>{media.name}</div>
                <div className="lab-mono" style={{ fontSize: 10, color: "var(--ink-3)", marginTop: 1 }}>
                  VIDEO · {media.duration} · {media.size}
                </div>
              </div>
              <button onClick={() => setMedia(null)} style={pillBtn}>
                Remove
              </button>
            </div>
          )}
        </div>

        <div
          style={{
            marginTop: 18,
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          {[
            { l: "Score a video", i: <I.Video size={11} /> },
            { l: "Audit a carousel", i: <I.Image size={11} /> },
            { l: "Compare two ads", i: <I.Compare size={11} /> },
            { l: "Use last brief", i: <I.ChevronD size={11} /> },
          ].map((c, i) => (
            <button key={i} style={chipBtn}>
              <span style={{ display: "inline-flex", marginRight: 6, color: "var(--teal-2)" }}>
                {c.i}
              </span>
              {c.l}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

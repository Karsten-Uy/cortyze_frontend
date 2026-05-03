"use client";

import { useState, type CSSProperties } from "react";

import { I } from "./Icons";
import { BrainMap, type BrainView } from "./BrainMap";
import { LAB_GOALS, type LabData, type LabGoal, type LabRegion, type LabSuggestion } from "@/lib/lab/data";
import { computeOverall, petColor } from "@/lib/lab/petColor";

const SEVERITY: Record<
  LabSuggestion["severity"],
  { label: string; color: string; bg: string }
> = {
  critical: { label: "CRITICAL", color: "#A33C2A", bg: "#F2DCD6" },
  high: { label: "HIGH", color: "#B86F3D", bg: "#F2E2D2" },
  medium: { label: "MEDIUM", color: "#7A6A2A", bg: "#EDE6CE" },
  low: { label: "LOW", color: "#3B7A4F", bg: "#DCE7DA" },
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="lab-mono"
      style={{
        fontSize: 10,
        letterSpacing: "0.18em",
        color: "var(--ink-3)",
        textTransform: "uppercase",
        display: "flex",
        alignItems: "center",
        gap: 8,
      }}
    >
      <span style={{ width: 18, height: 1, background: "var(--ink-3)" }} />
      {children}
    </div>
  );
}

function RegionCell({
  region,
  hovered,
  onHover,
}: {
  region: LabRegion;
  hovered: boolean;
  onHover: (k: string | null) => void;
}) {
  const c = petColor(region.score);
  return (
    <div
      onMouseEnter={() => onHover(region.key)}
      onMouseLeave={() => onHover(null)}
      style={{
        padding: "10px 12px",
        borderRight: "1px solid var(--rule)",
        borderBottom: "1px solid var(--rule)",
        background: hovered ? "#F2F1EC" : "transparent",
        cursor: "pointer",
        position: "relative",
        transition: "background 120ms",
        marginRight: -1,
        marginBottom: -1,
        display: "flex",
        alignItems: "center",
        gap: 10,
      }}
    >
      <div
        style={{
          width: 34,
          height: 34,
          background: c,
          display: "grid",
          placeItems: "center",
          flexShrink: 0,
          border: "1px solid rgba(26,26,27,0.2)",
        }}
      >
        <span
          className="lab-mono"
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: "#F9F9F7",
            letterSpacing: "-0.02em",
          }}
        >
          {region.score}
        </span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            gap: 6,
          }}
        >
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "var(--ink)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {region.name}
          </span>
          <span
            className="lab-mono"
            style={{
              fontSize: 9,
              color: "var(--ink-3)",
              flexShrink: 0,
              letterSpacing: "0.04em",
            }}
          >
            {region.weight}%
          </span>
        </div>
        <div
          style={{
            fontSize: 10.5,
            color: "var(--ink-3)",
            lineHeight: 1.35,
            marginTop: 2,
            overflow: "hidden",
            textOverflow: "ellipsis",
            display: "-webkit-box",
            WebkitLineClamp: 1,
            WebkitBoxOrient: "vertical",
          }}
        >
          {region.blurb}
        </div>
      </div>
    </div>
  );
}

function MiniDelta({ label, from, to }: { label: string; from: number; to: number }) {
  return (
    <div style={{ background: "#FBFBF9", padding: "6px 8px", border: "1px solid var(--rule)" }}>
      <div className="lab-mono" style={{ fontSize: 8, color: "var(--ink-3)", letterSpacing: "0.08em" }}>
        {label.toUpperCase()}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginTop: 2 }}>
        <span
          className="lab-mono"
          style={{ fontSize: 11, color: "var(--ink-3)", textDecoration: "line-through" }}
        >
          {Number(from).toFixed(1)}
        </span>
        <I.Arrow size={9} style={{ color: "var(--ink-3)" }} />
        <span className="lab-mono" style={{ fontSize: 13, color: "#3B7A4F", fontWeight: 600 }}>
          {Number(to).toFixed(1)}
        </span>
      </div>
    </div>
  );
}

function SimulatedExample({ sug }: { sug: LabSuggestion }) {
  const deltaInt = parseInt(sug.delta, 10);
  return (
    <div>
      <div style={{ display: "flex", gap: 6 }}>
        {[
          { label: "BEFORE", tone: "flat" as const },
          { label: "EDIT", tone: "change" as const },
          { label: "AFTER", tone: "lift" as const },
        ].map((f, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              aspectRatio: "4/5",
              background:
                f.tone === "flat" ? "#D8D4CA" : f.tone === "change" ? "#C4BBA5" : "#A8956B",
              border: "1px solid rgba(26,26,27,0.2)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <svg width="100%" height="100%" viewBox="0 0 40 50" preserveAspectRatio="none">
              <rect x="14" y="12" width="12" height="28" fill="rgba(26,26,27,0.18)" />
              <rect x="16" y="8" width="8" height="4" fill="rgba(26,26,27,0.3)" />
              {f.tone === "lift" && <circle cx="32" cy="42" r="6" fill="#A33C2A" opacity="0.5" />}
              {f.tone === "change" && (
                <line
                  x1="0"
                  y1="25"
                  x2="40"
                  y2="25"
                  stroke="#A33C2A"
                  strokeDasharray="1.5 1.5"
                  strokeWidth="0.4"
                />
              )}
            </svg>
            <div
              className="lab-mono"
              style={{
                position: "absolute",
                bottom: 4,
                left: 4,
                fontSize: 8,
                color: "#F9F9F7",
                background: "rgba(26,26,27,0.7)",
                padding: "1px 4px",
              }}
            >
              {f.label}
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <MiniDelta
          label={sug.region}
          from={Math.max(20, deltaInt * 2)}
          to={Math.max(20, deltaInt * 2) + deltaInt}
        />
        <MiniDelta label="Composite" from={35.2} to={35.2 + deltaInt * 0.4} />
      </div>
    </div>
  );
}

function SuggestionCard({
  s,
  open,
  onOpen,
  index,
}: {
  s: LabSuggestion;
  open: boolean;
  onOpen: () => void;
  index: number;
}) {
  const sev = SEVERITY[s.severity];
  return (
    <div
      style={{
        borderTop: "1px solid var(--rule)",
        borderLeft: "1px solid var(--rule)",
        borderRight: "1px solid var(--rule)",
        borderBottom: "1px solid var(--rule)",
        marginBottom: -1,
        background: open ? "#FBFBF9" : "transparent",
        transition: "background 150ms",
      }}
    >
      <button
        onClick={onOpen}
        style={{
          width: "100%",
          textAlign: "left",
          background: "transparent",
          border: "none",
          padding: "14px 16px",
          display: "flex",
          alignItems: "center",
          gap: 14,
          cursor: "pointer",
        }}
      >
        <span className="lab-mono" style={{ fontSize: 10, color: "var(--ink-4)", minWidth: 22 }}>
          {String(index).padStart(2, "0")}
        </span>
        <span
          style={{
            fontSize: 9,
            fontFamily: "var(--font-jbm)",
            letterSpacing: "0.1em",
            padding: "2px 7px",
            background: sev.bg,
            color: sev.color,
          }}
        >
          {sev.label}
        </span>
        <span className="lab-mono" style={{ fontSize: 10, color: "var(--ink-3)", minWidth: 90 }}>
          {s.region}
        </span>
        <span className="lab-mono" style={{ fontSize: 10, color: "var(--ink-3)", minWidth: 60 }}>
          {s.ts}
        </span>
        <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: "var(--ink)" }}>
          {s.title}
        </span>
        <span className="lab-mono" style={{ fontSize: 10, color: "var(--teal-2)", fontWeight: 500 }}>
          {s.delta}
        </span>
        <span
          style={{
            width: 18,
            height: 18,
            display: "grid",
            placeItems: "center",
            color: "var(--ink-3)",
            transform: open ? "rotate(90deg)" : "none",
            transition: "transform 180ms",
          }}
        >
          <I.Chevron size={11} />
        </span>
      </button>
      {open && (
        <div
          style={{
            padding: "0 16px 16px",
            display: "grid",
            gridTemplateColumns: "1.3fr 1fr",
            gap: 18,
            animation: "labFadeUp 220ms ease",
          }}
        >
          <div>
            <div style={{ fontSize: 12, color: "var(--ink-2)", lineHeight: 1.6 }}>{s.body}</div>
            <div
              style={{
                marginTop: 12,
                display: "flex",
                gap: 12,
                alignItems: "center",
                borderTop: "1px solid var(--rule)",
                paddingTop: 12,
              }}
            >
              <div className="lab-mono" style={{ fontSize: 10, color: "var(--ink-3)" }}>
                EXPECTED LIFT
              </div>
              <div
                className="lab-mono"
                style={{ fontSize: 13, color: "var(--teal-2)", fontWeight: 600 }}
              >
                {s.delta}
              </div>
              <div style={{ fontSize: 11, color: "var(--ink-3)" }}>{s.metric}</div>
              <div style={{ flex: 1 }} />
              <button
                style={{
                  fontSize: 11,
                  padding: "5px 10px",
                  background: "#1A1A1B",
                  color: "#F9F9F7",
                  border: "none",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                Apply <I.Arrow size={10} />
              </button>
              <button
                style={{
                  fontSize: 11,
                  padding: "5px 10px",
                  background: "transparent",
                  color: "var(--ink-2)",
                  border: "1px solid var(--rule)",
                }}
              >
                Dismiss
              </button>
            </div>
          </div>
          <div style={{ border: "1px solid var(--rule)", background: "#F2F1EC", padding: 12 }}>
            <div
              className="lab-mono"
              style={{
                fontSize: 9,
                color: "var(--ink-3)",
                letterSpacing: "0.1em",
                marginBottom: 8,
              }}
            >
              SIMULATED EXAMPLE
            </div>
            <SimulatedExample sug={s} />
            {s.exampleLabel && (
              <div
                style={{
                  marginTop: 10,
                  paddingTop: 10,
                  borderTop: "1px solid var(--rule)",
                }}
              >
                <div className="lab-mono" style={{ fontSize: 9, color: "var(--ink-3)" }}>
                  {s.exampleLabel.toUpperCase()}
                </div>
                {s.exampleNote && (
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--ink-2)",
                      marginTop: 3,
                      fontStyle: "italic",
                    }}
                  >
                    &ldquo;{s.exampleNote}&rdquo;
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const crosshair: CSSProperties = {
  position: "absolute",
  width: 8,
  height: 8,
  pointerEvents: "none",
};

function Crosshair(pos: { top?: number; right?: number; bottom?: number; left?: number }) {
  return (
    <span className="lab-crosshair" style={{ ...crosshair, ...pos }}>
      <span style={{ position: "absolute", left: 0, right: 0, top: "50%", height: 1, background: "var(--ink)", transform: "translateY(-50%)" }} />
      <span style={{ position: "absolute", top: 0, bottom: 0, left: "50%", width: 1, background: "var(--ink)", transform: "translateX(-50%)" }} />
    </span>
  );
}

export function InsightView({
  data,
  brainView,
  setBrainView,
}: {
  data: LabData;
  brainView: BrainView;
  setBrainView: (v: BrainView) => void;
}) {
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const [openSugg, setOpenSugg] = useState<string | null>("s1");
  const [goal, setGoal] = useState<LabGoal>("Brand Recall");

  const overall = computeOverall(data.regions);

  return (
    <div style={{ minWidth: 0 }}>
      <div
        className="lab-insight-split"
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(380px, 1fr) minmax(380px, 1fr)",
          gap: 0,
          borderBottom: "1px solid var(--rule)",
        }}
      >
        <div
          className="lab-insight-left"
          style={{
            borderRight: "1px solid var(--rule)",
            padding: "24px 28px 28px",
            minWidth: 0,
            position: "relative",
          }}
        >
          <SectionLabel>01 · Activation</SectionLabel>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: 6,
              marginBottom: 10,
            }}
          >
            <div className="lab-serif" style={{ fontSize: 18, letterSpacing: "-0.01em" }}>
              Where the brain lit up
            </div>
            <div style={{ display: "flex", border: "1px solid var(--rule)" }}>
              {(
                [
                  { k: "axial", l: "Axial" },
                  { k: "sagittal", l: "Sagittal" },
                  { k: "abstract", l: "Graph" },
                ] as { k: BrainView; l: string }[]
              ).map((v, i) => (
                <button
                  key={v.k}
                  onClick={() => setBrainView(v.k)}
                  style={{
                    padding: "5px 10px",
                    fontSize: 10,
                    fontFamily: "var(--font-jbm)",
                    letterSpacing: "0.06em",
                    background: brainView === v.k ? "#1A1A1B" : "transparent",
                    color: brainView === v.k ? "#F9F9F7" : "var(--ink-2)",
                    border: "none",
                    borderRight: i < 2 ? "1px solid var(--rule)" : "none",
                    textTransform: "uppercase",
                    cursor: "pointer",
                  }}
                >
                  {v.l}
                </button>
              ))}
            </div>
          </div>

          <div
            style={{
              border: "1px solid var(--rule)",
              background: "#FBFBF9",
              padding: 16,
              position: "relative",
            }}
          >
            <Crosshair top={4} left={4} />
            <Crosshair top={4} right={4} />
            <Crosshair bottom={4} left={4} />
            <Crosshair bottom={4} right={4} />

            <div
              className="lab-mono"
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 9,
                color: "var(--ink-3)",
                letterSpacing: "0.1em",
                marginBottom: 8,
              }}
            >
              <span>SLICE · {brainView.toUpperCase()}</span>
              <span>FRAME · 0:12</span>
              <span>WEIGHTING · {goal.toUpperCase()}</span>
            </div>

            <BrainMap
              regions={data.regions}
              view={brainView}
              hoveredKey={hoveredKey}
              onHover={setHoveredKey}
            />

            <div
              style={{
                marginTop: 12,
                paddingTop: 12,
                borderTop: "1px solid var(--rule)",
              }}
            >
              <div
                className="lab-mono"
                style={{
                  fontSize: 9,
                  color: "var(--ink-3)",
                  letterSpacing: "0.1em",
                  marginBottom: 6,
                }}
              >
                ACTIVATION INTENSITY
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span className="lab-mono" style={{ fontSize: 10, color: "var(--ink-3)" }}>
                  0
                </span>
                <div
                  style={{
                    flex: 1,
                    height: 8,
                    background:
                      "linear-gradient(90deg, #2E2A52, #5B3B7A, #9C4A6E, #C76A4A, #D89A3F, #E8C66B)",
                  }}
                />
                <span className="lab-mono" style={{ fontSize: 10, color: "var(--ink-3)" }}>
                  100
                </span>
              </div>
            </div>
          </div>
        </div>

        <div style={{ minWidth: 0, padding: "24px 28px 28px" }}>
          <SectionLabel>02 · Composite</SectionLabel>
          <div
            style={{
              border: "1px solid var(--rule)",
              padding: "16px 18px",
              marginTop: 8,
              marginBottom: 22,
              background: "#FBFBF9",
              display: "grid",
              gridTemplateColumns: "auto 1fr",
              gap: 18,
              alignItems: "center",
            }}
          >
            <div>
              <div
                className="lab-mono"
                style={{
                  fontSize: 9,
                  letterSpacing: "0.12em",
                  color: "var(--ink-3)",
                  marginBottom: 4,
                }}
              >
                CORTYZE INDEX
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                <span
                  className="lab-serif"
                  style={{
                    fontSize: 44,
                    lineHeight: 1,
                    fontWeight: 400,
                    letterSpacing: "-0.04em",
                  }}
                >
                  {overall.toFixed(1)}
                </span>
                <span className="lab-mono" style={{ fontSize: 12, color: "var(--ink-3)" }}>
                  /100
                </span>
              </div>
              <div style={{ marginTop: 6 }}>
                <span
                  style={{
                    fontSize: 9,
                    fontFamily: "var(--font-jbm)",
                    padding: "2px 6px",
                    background: "#F2DCD6",
                    color: "#A33C2A",
                    letterSpacing: "0.08em",
                  }}
                >
                  UNDERPERFORMING
                </span>
              </div>
            </div>
            <div>
              <div style={{ position: "relative", height: 30, marginBottom: 8 }}>
                <div
                  style={{
                    position: "absolute",
                    top: 14,
                    left: 0,
                    right: 0,
                    height: 2,
                    background:
                      "linear-gradient(90deg, #A33C2A 0%, #B86F3D 35%, #D89A3F 55%, #3B7A4F 80%)",
                  }}
                />
                {[20, 40, 60, 80].map((t) => (
                  <div
                    key={t}
                    style={{
                      position: "absolute",
                      left: `${t}%`,
                      top: 10,
                      width: 1,
                      height: 10,
                      background: "var(--ink-3)",
                    }}
                  />
                ))}
                <div
                  style={{
                    position: "absolute",
                    left: `${overall}%`,
                    top: 6,
                    width: 2,
                    height: 18,
                    background: "var(--ink)",
                    transform: "translateX(-50%)",
                  }}
                />
                <div
                  className="lab-mono"
                  style={{
                    position: "absolute",
                    left: `${overall}%`,
                    top: -2,
                    transform: "translateX(-50%)",
                    fontSize: 9,
                    color: "var(--ink)",
                    whiteSpace: "nowrap",
                  }}
                >
                  YOU · {overall.toFixed(1)}
                </div>
                <div
                  className="lab-mono"
                  style={{
                    position: "absolute",
                    left: "64%",
                    top: 18,
                    fontSize: 9,
                    color: "var(--ink-3)",
                    whiteSpace: "nowrap",
                    transform: "translateX(-50%)",
                  }}
                >
                  BENCHMARK · 64
                </div>
              </div>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                {LAB_GOALS.map((g) => (
                  <button
                    key={g}
                    onClick={() => setGoal(g)}
                    style={{
                      fontSize: 9,
                      padding: "3px 7px",
                      fontFamily: "var(--font-jbm)",
                      letterSpacing: "0.04em",
                      border: "1px solid " + (goal === g ? "var(--ink)" : "var(--rule)"),
                      background: goal === g ? "#1A1A1B" : "transparent",
                      color: goal === g ? "#F9F9F7" : "var(--ink-2)",
                      cursor: "pointer",
                    }}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <SectionLabel>03 · By region</SectionLabel>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              marginTop: 6,
              marginBottom: 10,
            }}
          >
            <div className="lab-serif" style={{ fontSize: 18, letterSpacing: "-0.01em" }}>
              Eight regions, eight scores
            </div>
            <span className="lab-mono" style={{ fontSize: 10, color: "var(--ink-3)" }}>
              WEIGHTED · {goal.toUpperCase()}
            </span>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: 0,
              border: "1px solid var(--rule)",
              background: "#FBFBF9",
            }}
          >
            {data.regions.map((r) => (
              <RegionCell
                key={r.key}
                region={r}
                hovered={hoveredKey === r.key}
                onHover={setHoveredKey}
              />
            ))}
          </div>
        </div>
      </div>

      <div style={{ padding: "24px 28px 60px" }}>
        <SectionLabel>04 · Suggestions</SectionLabel>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            marginTop: 6,
            marginBottom: 4,
          }}
        >
          <div className="lab-serif" style={{ fontSize: 22, letterSpacing: "-0.01em" }}>
            {data.suggestions.length} ways to lift this
          </div>
          <button
            style={{
              fontSize: 10,
              padding: "4px 8px",
              fontFamily: "var(--font-jbm)",
              border: "1px solid var(--rule)",
              background: "transparent",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <I.Filter size={10} /> SORT · IMPACT
          </button>
        </div>
        <div style={{ fontSize: 11, color: "var(--ink-3)", marginBottom: 12 }}>
          Click any to expand a simulated example.
        </div>
        <div>
          {data.suggestions.map((s, i) => (
            <SuggestionCard
              key={s.id}
              s={s}
              open={openSugg === s.id}
              onOpen={() => setOpenSugg(openSugg === s.id ? null : s.id)}
              index={i + 1}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

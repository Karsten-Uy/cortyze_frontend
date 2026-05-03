"use client";

import { useState, type CSSProperties } from "react";

import { BrainMap } from "./BrainMap";
import { computeOverall, petColor } from "@/lib/lab/petColor";
import type { LabData, LabRegion } from "@/lib/lab/data";

const crosshair: CSSProperties = {
  position: "absolute",
  width: 8,
  height: 8,
  pointerEvents: "none",
};

function Crosshair(pos: { top?: number; right?: number; bottom?: number; left?: number }) {
  return (
    <span style={{ ...crosshair, ...pos }}>
      <span style={{ position: "absolute", left: 0, right: 0, top: "50%", height: 1, background: "var(--ink)", transform: "translateY(-50%)" }} />
      <span style={{ position: "absolute", top: 0, bottom: 0, left: "50%", width: 1, background: "var(--ink)", transform: "translateX(-50%)" }} />
    </span>
  );
}

function SpecimenHeader({
  label,
  name,
  sub,
  score,
  status,
  right,
}: {
  label: string;
  name: string;
  sub: string;
  score: number;
  status: string;
  right?: boolean;
}) {
  const c = petColor(score);
  return (
    <div
      style={{
        padding: "14px 18px",
        display: "flex",
        gap: 14,
        alignItems: "center",
        flexDirection: right ? "row-reverse" : "row",
        textAlign: right ? "right" : "left",
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          background: c,
          border: "1px solid rgba(26,26,27,0.2)",
          display: "grid",
          placeItems: "center",
          flexShrink: 0,
        }}
      >
        <span className="lab-mono" style={{ fontSize: 13, color: "#F9F9F7", fontWeight: 600 }}>
          {score.toFixed(0)}
        </span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="lab-mono" style={{ fontSize: 9, color: "var(--ink-3)", letterSpacing: "0.12em" }}>
          {label}
        </div>
        <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>{name}</div>
        <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 1 }}>{sub}</div>
        <div
          className="lab-mono"
          style={{
            fontSize: 9,
            color: status.includes("UNDER") ? "#A33C2A" : "#3B7A4F",
            letterSpacing: "0.08em",
            marginTop: 4,
          }}
        >
          {score.toFixed(1)} / 100 · {status}
        </div>
      </div>
    </div>
  );
}

function ConnectorRail({
  A,
  B,
  hovered,
  setHovered,
}: {
  A: LabRegion[];
  B: LabRegion[];
  hovered: string | null;
  setHovered: (k: string | null) => void;
}) {
  const H = 280;
  return (
    <div style={{ position: "relative", height: "100%", minHeight: H }}>
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        style={{ position: "absolute", inset: 0 }}
      >
        {A.map((a, i) => {
          const b = B[i];
          const delta = b.score - a.score;
          const y = 8 + (i / (A.length - 1)) * 84;
          const midX = 50 + (delta > 0 ? 8 : -8);
          const isHover = hovered === a.key;
          const color = delta > 0 ? "#2D7071" : "#B86F3D";
          return (
            <g
              key={a.key}
              opacity={hovered ? (isHover ? 1 : 0.18) : 0.7}
              style={{ transition: "opacity 150ms" }}
            >
              <path
                d={`M 0 ${y} Q ${midX} ${y + (delta > 0 ? -4 : 4)} 100 ${y}`}
                fill="none"
                stroke={color}
                strokeWidth={isHover ? 0.8 : 0.4}
                strokeDasharray={delta > 0 ? "0" : "1.5 1"}
                style={{ transition: "stroke-width 150ms" }}
              />
              <circle cx="0" cy={y} r="0.8" fill={color} />
              <circle cx="100" cy={y} r="0.8" fill={color} />
            </g>
          );
        })}
      </svg>

      <div
        style={{
          position: "relative",
          height: "100%",
          minHeight: H,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-around",
          padding: "14px 0",
        }}
      >
        {A.map((a, i) => {
          const b = B[i];
          const delta = b.score - a.score;
          const isHover = hovered === a.key;
          return (
            <div
              key={a.key}
              onMouseEnter={() => setHovered(a.key)}
              onMouseLeave={() => setHovered(null)}
              style={{
                textAlign: "center",
                padding: "4px 8px",
                background: isHover ? "#FBFBF9" : "transparent",
                border: "1px solid " + (isHover ? "var(--ink)" : "transparent"),
                margin: "0 14px",
                cursor: "pointer",
              }}
            >
              <div
                className="lab-mono"
                style={{ fontSize: 9, color: "var(--ink-3)", letterSpacing: "0.08em" }}
              >
                {a.name.toUpperCase().slice(0, 14)}
              </div>
              <div
                className="lab-mono"
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: delta > 0 ? "#3B7A4F" : "#A33C2A",
                  marginTop: 1,
                }}
              >
                {a.score} → {b.score}{" "}
                <span style={{ color: "var(--ink-3)", fontWeight: 400 }}>
                  {delta > 0 ? "+" : ""}
                  {delta}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BarPair({ score }: { score: number }) {
  const c = petColor(score);
  return (
    <div style={{ height: 6, background: "var(--rule-2)", position: "relative" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          width: `${score}%`,
          background: c,
        }}
      />
    </div>
  );
}

function Takeaway({
  label,
  region,
  delta,
  body,
  good,
  teal,
}: {
  label: string;
  region: string;
  delta: string;
  body: string;
  good?: boolean;
  teal?: boolean;
}) {
  const accent = teal ? "var(--teal)" : good ? "#3B7A4F" : "#A33C2A";
  return (
    <div
      style={{
        border: "1px solid var(--rule)",
        background: "#FBFBF9",
        padding: 16,
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: 18,
          height: 2,
          background: accent,
        }}
      />
      <div
        className="lab-mono"
        style={{ fontSize: 9, letterSpacing: "0.12em", color: "var(--ink-3)" }}
      >
        {label.toUpperCase()}
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 8,
          marginTop: 6,
          marginBottom: 6,
        }}
      >
        <span className="lab-serif" style={{ fontSize: 18, letterSpacing: "-0.01em" }}>
          {region}
        </span>
        <span
          className="lab-mono"
          style={{ fontSize: 12, color: accent, fontWeight: 600 }}
        >
          {delta}
        </span>
      </div>
      <div style={{ fontSize: 11, color: "var(--ink-2)", lineHeight: 1.55 }}>{body}</div>
    </div>
  );
}

export function CompareView({ data }: { data: LabData }) {
  const [hovered, setHovered] = useState<string | null>(null);

  const A = data.regions;
  const B: LabRegion[] = data.regionsB.map((b) => {
    const meta = data.regions.find((r) => r.key === b.key)!;
    return { ...meta, score: b.score };
  });

  const overallA = computeOverall(A);
  const overallB = computeOverall(B);

  return (
    <div style={{ flex: 1, overflow: "auto", padding: "20px 28px 60px" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 220px 1fr",
          gap: 0,
          alignItems: "stretch",
          marginBottom: 20,
          border: "1px solid var(--rule)",
          background: "#FBFBF9",
        }}
      >
        <SpecimenHeader
          label="POST · A"
          name="Reset Ritual v3"
          sub="Hero, 0:30, 1080×1080"
          score={overallA}
          status="UNDERPERFORMING"
        />
        <div
          style={{
            borderLeft: "1px solid var(--rule)",
            borderRight: "1px solid var(--rule)",
            padding: "14px 16px",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <div
            className="lab-mono"
            style={{ fontSize: 9, color: "var(--ink-3)", letterSpacing: "0.14em" }}
          >
            DELTA · A → B
          </div>
          <div
            className="lab-serif"
            style={{
              fontSize: 28,
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
              marginTop: 4,
              color: "#3B7A4F",
            }}
          >
            +{(overallB - overallA).toFixed(1)}
          </div>
          <div className="lab-mono" style={{ fontSize: 9, color: "var(--ink-3)", marginTop: 2 }}>
            B OUTPERFORMS · 7 / 8 REGIONS
          </div>
        </div>
        <SpecimenHeader
          label="POST · B"
          name="Skin Diary"
          sub="Carousel, static, 1080×1350"
          score={overallB}
          status="ABOVE BENCHMARK"
          right
        />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 220px 1fr",
          gap: 0,
          position: "relative",
        }}
      >
        <div
          style={{
            border: "1px solid var(--rule)",
            background: "#FBFBF9",
            padding: 18,
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
              fontSize: 9,
              color: "var(--ink-3)",
              marginBottom: 6,
              letterSpacing: "0.1em",
            }}
          >
            POST A · ACTIVATION MAP
          </div>
          <BrainMap
            regions={A}
            view="axial"
            hoveredKey={hovered}
            onHover={setHovered}
            compact
          />
        </div>

        <div
          style={{
            borderTop: "1px solid var(--rule)",
            borderBottom: "1px solid var(--rule)",
            background: "#F2F1EC",
            position: "relative",
          }}
        >
          <ConnectorRail A={A} B={B} hovered={hovered} setHovered={setHovered} />
        </div>

        <div
          style={{
            border: "1px solid var(--rule)",
            background: "#FBFBF9",
            padding: 18,
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
              fontSize: 9,
              color: "var(--ink-3)",
              marginBottom: 6,
              letterSpacing: "0.1em",
              textAlign: "right",
            }}
          >
            POST B · ACTIVATION MAP
          </div>
          <BrainMap
            regions={B}
            view="axial"
            hoveredKey={hovered}
            onHover={setHovered}
            compact
          />
        </div>
      </div>

      <div style={{ marginTop: 28 }}>
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
            marginBottom: 12,
          }}
        >
          <span style={{ width: 18, height: 1, background: "var(--ink-3)" }} />
          Region-by-region delta
        </div>
        <div style={{ border: "1px solid var(--rule)", background: "#FBFBF9" }}>
          <div
            className="lab-mono"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 60px 100px 60px 1fr 100px",
              fontSize: 9,
              color: "var(--ink-3)",
              letterSpacing: "0.08em",
              padding: "8px 14px",
              borderBottom: "1px solid var(--rule)",
            }}
          >
            <span>REGION</span>
            <span style={{ textAlign: "right" }}>A</span>
            <span></span>
            <span style={{ textAlign: "right" }}>B</span>
            <span></span>
            <span style={{ textAlign: "right" }}>Δ</span>
          </div>
          {A.map((a, i) => {
            const b = B[i];
            const delta = b.score - a.score;
            return (
              <div
                key={a.key}
                onMouseEnter={() => setHovered(a.key)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 60px 100px 60px 1fr 100px",
                  alignItems: "center",
                  padding: "10px 14px",
                  borderBottom: i < A.length - 1 ? "1px solid var(--rule-2)" : "none",
                  background: hovered === a.key ? "#F2F1EC" : "transparent",
                  fontSize: 12,
                }}
              >
                <span style={{ fontWeight: 500 }}>{a.name}</span>
                <span
                  className="lab-mono"
                  style={{ textAlign: "right", color: "var(--ink-2)" }}
                >
                  {a.score}
                </span>
                <BarPair score={a.score} />
                <span
                  className="lab-mono"
                  style={{ textAlign: "right", color: "var(--ink-2)" }}
                >
                  {b.score}
                </span>
                <BarPair score={b.score} />
                <span
                  className="lab-mono"
                  style={{
                    textAlign: "right",
                    fontWeight: 600,
                    color: delta > 0 ? "#3B7A4F" : "#A33C2A",
                  }}
                >
                  {delta > 0 ? "+" : ""}
                  {delta}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ marginTop: 28, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
        <Takeaway
          label="Where B wins biggest"
          region="Fusiform Face"
          delta="+39"
          body="The carousel's founder portrait registers 0.9s of stable face encoding. The video version cuts away after 380ms — below FFA threshold."
        />
        <Takeaway
          label="Where A wins"
          region="Temporal / Language"
          delta="−9"
          body="Voiceover in the video carries verbal benefit cues that the static carousel lacks. Steal this for B's caption."
          good
        />
        <Takeaway
          label="Recommended action"
          region="Synthesize"
          delta="·"
          body="Borrow B's face hold and A's voiceover into a v4 cut. Projected composite: 67.3 (above benchmark)."
          teal
        />
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";

import { Badge } from "@/components/Badge";
import {
  type ComparisonNarrative,
  type DemoRun,
  type RegionKey,
  type SuggestionPlan,
  getComparisonNarrative,
  getDemoRun,
} from "@/lib/api";
import { buildFallbackNarrative } from "@/lib/compareNarrative";
import { REGION_INFO } from "@/lib/cortyze-data";

const DEMO_IDS = ["lays", "apple_1984", "coinbase"] as const;

const REGION_ORDER: RegionKey[] = [
  "memory",
  "emotion",
  "attention",
  "language",
  "face",
  "reward",
];

const REGION_LABELS: Record<RegionKey, string> = {
  memory: "Memory",
  emotion: "Emotion",
  attention: "Attention",
  language: "Language",
  face: "Face",
  reward: "Reward",
};

// Selection is an ordered tuple [older, newer]. Clicking a third demo
// drops the older entry, keeps the newer (now becomes "older"), and
// puts the click target in the newer slot.
type Selection = readonly [string, string];

const DEFAULT_SELECTION: Selection = ["lays", "apple_1984"];

function pairKey(a: string, b: string): string {
  return [a, b].sort().join("_vs_");
}

type LoadedState =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "ready"; demos: DemoRun[] };

export function Compare() {
  const [state, setState] = useState<LoadedState>({ kind: "loading" });
  const [selection, setSelection] = useState<Selection>(DEFAULT_SELECTION);
  // Cache pairwise narratives so flipping back to a previous pair is
  // instant. Key = sorted pair_key.
  const [narratives, setNarratives] = useState<
    Record<string, ComparisonNarrative>
  >({});

  // Fetch all 3 demo plans once. Selection changes don't refetch the
  // plans — only the narrative lookup is per-pair.
  useEffect(() => {
    let cancelled = false;
    Promise.all(DEMO_IDS.map((id) => getDemoRun(id)))
      .then((demos) => {
        if (!cancelled) setState({ kind: "ready", demos });
      })
      .catch((err) => {
        if (cancelled) return;
        const msg =
          err instanceof Error ? err.message : "Failed to load demos";
        setState({ kind: "error", message: msg });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Lookup-or-fetch the canned narrative for the active pair. On error,
  // fall back to the deterministic delta-based generator so the page
  // always renders something useful.
  useEffect(() => {
    if (state.kind !== "ready") return;
    const key = pairKey(selection[0], selection[1]);
    if (narratives[key]) return;

    let cancelled = false;
    getComparisonNarrative(selection[0], selection[1])
      .then((n) => {
        if (cancelled) return;
        setNarratives((prev) => ({ ...prev, [key]: n }));
      })
      .catch(() => {
        if (cancelled) return;
        const a = state.demos.find((d) => d.demo_id === selection[0]);
        const b = state.demos.find((d) => d.demo_id === selection[1]);
        if (!a || !b) return;
        const fallback = buildFallbackNarrative([
          { id: a.demo_id, label: a.label, plan: a.plan },
          { id: b.demo_id, label: b.label, plan: b.plan },
        ]);
        setNarratives((prev) => ({ ...prev, [key]: fallback }));
      });
    return () => {
      cancelled = true;
    };
  }, [state, selection, narratives]);

  function handleSelectDemo(id: string) {
    if (selection.includes(id)) return; // already selected — no-op
    // Drop the older slot, slide newer→older, place clicked demo as
    // the new newer slot.
    setSelection([selection[1], id] as const);
  }

  if (state.kind === "loading") {
    return (
      <div
        style={{
          flex: 1,
          display: "grid",
          placeItems: "center",
          color: "var(--ink-3)",
          fontSize: 13,
        }}
      >
        Loading comparison…
      </div>
    );
  }

  if (state.kind === "error") {
    return (
      <div
        style={{
          flex: 1,
          display: "grid",
          placeItems: "center",
          padding: 32,
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: 360 }}>
          <div
            className="serif"
            style={{ fontSize: 18, color: "var(--ink)", marginBottom: 6 }}
          >
            Couldn&apos;t load the comparison
          </div>
          <div style={{ fontSize: 13, color: "var(--ink-3)" }}>
            {state.message}
          </div>
        </div>
      </div>
    );
  }

  const { demos } = state;
  const demoA = demos.find((d) => d.demo_id === selection[0]);
  const demoB = demos.find((d) => d.demo_id === selection[1]);
  const narrative = narratives[pairKey(selection[0], selection[1])];

  return (
    <div
      style={{
        flex: 1,
        overflowY: "auto",
        padding: "24px clamp(16px, 4vw, 40px) 48px",
      }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <Header />
        <Picker
          demos={demos}
          selection={selection}
          onSelect={handleSelectDemo}
        />
        {demoA && demoB && (
          <>
            <DemosRow
              demoA={demoA}
              demoB={demoB}
              winnerId={narrative?.winner_demo_id}
            />
            <RegionTable
              demoA={demoA}
              demoB={demoB}
              winners={narrative?.per_region_winners}
            />
            {narrative ? (
              <>
                <WinnerCallout narrative={narrative} demos={[demoA, demoB]} />
                <TakeawaysGrid
                  narrative={narrative}
                  demos={[demoA, demoB]}
                />
              </>
            ) : (
              <NarrativeLoading />
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function Header() {
  return (
    <div style={{ marginBottom: 16 }}>
      <div
        className="serif"
        style={{
          fontSize: 26,
          color: "var(--ink)",
          letterSpacing: "-0.01em",
          marginBottom: 4,
        }}
      >
        Compare two samples
      </div>
      <div style={{ fontSize: 13, color: "var(--ink-3)" }}>
        Pick any two of the three Super Bowl spots to see what wins, and why.
      </div>
    </div>
  );
}

function Picker({
  demos,
  selection,
  onSelect,
}: {
  demos: DemoRun[];
  selection: Selection;
  onSelect: (id: string) => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: 10,
        marginBottom: 18,
        flexWrap: "wrap",
      }}
    >
      {demos.map((d) => {
        const idx = selection.indexOf(d.demo_id);
        const isSelected = idx !== -1;
        return (
          <button
            key={d.demo_id}
            onClick={() => onSelect(d.demo_id)}
            disabled={isSelected}
            style={{
              flex: "1 1 200px",
              minWidth: 0,
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "8px 12px 8px 8px",
              border: `0.5px solid ${isSelected ? "var(--coral)" : "rgba(0,0,0,0.12)"}`,
              borderRadius: 10,
              background: isSelected ? "var(--coral-tint)" : "var(--cream)",
              color: "var(--ink)",
              cursor: isSelected ? "default" : "pointer",
              opacity: isSelected ? 1 : 0.85,
              textAlign: "left",
              transition: "all 150ms",
            }}
          >
            <div
              style={{
                width: 56,
                height: 32,
                borderRadius: 6,
                flexShrink: 0,
                backgroundImage: `url("${d.thumbnail_url}")`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                background: `url("${d.thumbnail_url}") center/cover, rgba(0,0,0,0.08)`,
              }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
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
                  marginTop: 1,
                }}
              >
                Score {d.plan.score} · {d.plan.status}
              </div>
            </div>
            {isSelected && (
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 600,
                  letterSpacing: "0.4px",
                  textTransform: "uppercase",
                  color: "var(--coral)",
                  flexShrink: 0,
                }}
              >
                Selected
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function DemosRow({
  demoA,
  demoB,
  winnerId,
}: {
  demoA: DemoRun;
  demoB: DemoRun;
  winnerId: string | undefined;
}) {
  return (
    <div className="cortyze-compare-row" style={rowStyle}>
      <DemoColumn demo={demoA} isWinner={demoA.demo_id === winnerId} />
      <VsDivider />
      <DemoColumn demo={demoB} isWinner={demoB.demo_id === winnerId} />
    </div>
  );
}

function VsDivider() {
  return (
    <div
      className="cortyze-compare-vs"
      style={{
        flex: "0 0 auto",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 4px",
      }}
    >
      <div
        className="serif"
        style={{
          fontSize: 18,
          color: "var(--ink-3)",
          letterSpacing: "0.04em",
        }}
      >
        vs
      </div>
    </div>
  );
}

function DemoColumn({ demo, isWinner }: { demo: DemoRun; isWinner: boolean }) {
  const tone = demo.plan.score < 50 ? "coral" : "green";
  return (
    <div
      style={{
        flex: 1,
        minWidth: 0,
        border: `0.5px solid ${isWinner ? "var(--coral)" : "rgba(0,0,0,0.08)"}`,
        borderRadius: 12,
        padding: 14,
        background: isWinner ? "var(--coral-tint)" : "var(--cream)",
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <MediaThumbnail
        url={demo.media_url}
        thumbnail={demo.thumbnail_url}
        label={demo.label}
      />
      {demo.media_url ? (
        <a
          href={demo.media_url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: "var(--ink)",
            lineHeight: 1.3,
            textDecoration: "none",
          }}
        >
          {demo.label}
        </a>
      ) : (
        <div
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: "var(--ink)",
            lineHeight: 1.3,
          }}
        >
          {demo.label}
        </div>
      )}
      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
        <span
          className="serif"
          style={{
            fontSize: 32,
            fontWeight: 500,
            color: "var(--ink)",
            letterSpacing: "-0.02em",
          }}
        >
          {demo.plan.score}
        </span>
        <span style={{ fontSize: 11, color: "var(--ink-3)" }}>/100</span>
      </div>
      <Badge tone={tone}>{demo.plan.status}</Badge>
    </div>
  );
}

function MediaThumbnail({
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
        aspectRatio: "16 / 9",
        background: "rgba(0,0,0,0.06)",
        borderRadius: 8,
        overflow: "hidden",
        backgroundImage: `url("${thumbnail}")`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {url && (
        <div
          aria-hidden="true"
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
          className="cortyze-media-overlay"
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
      aria-label={`Open ${label} in a new tab`}
      className="cortyze-media-link"
      style={{ display: "block", textDecoration: "none" }}
    >
      {tile}
    </a>
  );
}

function RegionTable({
  demoA,
  demoB,
  winners,
}: {
  demoA: DemoRun;
  demoB: DemoRun;
  winners: Record<RegionKey, string> | undefined;
}) {
  // Single open popover at a time, dismissed by clicking outside the
  // info trigger or popover. Mirrors the pattern used in Results.tsx
  // so behavior is consistent across the app.
  const [openKey, setOpenKey] = useState<RegionKey | null>(null);
  useEffect(() => {
    if (!openKey) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        !target?.closest("[data-info-popover]") &&
        !target?.closest("[data-info-trigger]")
      ) {
        setOpenKey(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [openKey]);

  return (
    <div
      style={{
        marginTop: 24,
        border: "0.5px solid rgba(0,0,0,0.08)",
        borderRadius: 12,
        padding: "14px 16px",
        background: "var(--cream)",
      }}
    >
      <div
        style={{
          fontSize: 11,
          color: "var(--ink-3)",
          letterSpacing: "0.4px",
          textTransform: "uppercase",
          marginBottom: 10,
        }}
      >
        Region scores
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {REGION_ORDER.map((key) => {
          // Until the canned narrative arrives, derive the winner of
          // each region row directly from scores so the highlight
          // doesn't flicker on first render.
          const fallbackWinner =
            scoreFor(demoA.plan, key) >= scoreFor(demoB.plan, key)
              ? demoA.demo_id
              : demoB.demo_id;
          const winnerId = winners?.[key] ?? fallbackWinner;
          return (
            <RegionCompareRow
              key={key}
              regionKey={key}
              demoA={demoA}
              demoB={demoB}
              winnerId={winnerId}
              isOpen={openKey === key}
              onToggle={() => setOpenKey(openKey === key ? null : key)}
            />
          );
        })}
      </div>
    </div>
  );
}

function RegionCompareRow({
  regionKey,
  demoA,
  demoB,
  winnerId,
  isOpen,
  onToggle,
}: {
  regionKey: RegionKey;
  demoA: DemoRun;
  demoB: DemoRun;
  winnerId: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const label = REGION_LABELS[regionKey];
  return (
    <div
      className="cortyze-compare-region-row"
      style={{ ...regionRowStyle, position: "relative" }}
    >
      <div
        style={{
          width: 90,
          flexShrink: 0,
          fontSize: 12,
          color: "var(--ink-2)",
          display: "flex",
          alignItems: "center",
          gap: 5,
        }}
      >
        <span>{label}</span>
        <button
          data-info-trigger
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          aria-label={`About ${label}`}
          style={{
            width: 14,
            height: 14,
            padding: 0,
            background: "transparent",
            border: "none",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            color: isOpen ? "var(--coral)" : "#999",
            transition: "color 120ms",
            flexShrink: 0,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1" />
            <circle cx="7" cy="4.2" r="0.7" fill="currentColor" />
            <path
              d="M7 6.5v4"
              stroke="currentColor"
              strokeWidth="1"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>
      <div
        style={{
          flex: 1,
          display: "flex",
          gap: 12,
          minWidth: 0,
        }}
      >
        <RegionBar
          score={scoreFor(demoA.plan, regionKey)}
          isWinner={demoA.demo_id === winnerId}
        />
        <RegionBar
          score={scoreFor(demoB.plan, regionKey)}
          isWinner={demoB.demo_id === winnerId}
        />
      </div>
      {isOpen && (
        <div
          data-info-popover
          className="fade-up"
          style={{
            position: "absolute",
            top: 24,
            left: 0,
            zIndex: 10,
            background: "#FAFAF7",
            border: "0.5px solid rgba(0,0,0,0.1)",
            borderRadius: 8,
            padding: "12px 14px",
            fontSize: 12,
            color: "#555",
            lineHeight: 1.5,
            maxWidth: 280,
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 500,
              color: "var(--ink)",
              marginBottom: 4,
            }}
          >
            {label}
          </div>
          {REGION_INFO[regionKey]}
        </div>
      )}
    </div>
  );
}

function RegionBar({ score, isWinner }: { score: number; isWinner: boolean }) {
  return (
    <div
      style={{
        flex: 1,
        minWidth: 0,
        display: "flex",
        alignItems: "center",
        gap: 8,
      }}
    >
      <div
        style={{
          flex: 1,
          height: 8,
          background: "rgba(0,0,0,0.06)",
          borderRadius: 4,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${Math.min(100, Math.max(0, score))}%`,
            height: "100%",
            background: isWinner ? "var(--coral)" : "var(--ink-3)",
            transition: "width 240ms ease",
          }}
        />
      </div>
      <div
        style={{
          width: 28,
          textAlign: "right",
          fontSize: 11,
          color: isWinner ? "var(--coral)" : "var(--ink-2)",
          fontWeight: isWinner ? 600 : 400,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {score}
      </div>
    </div>
  );
}

function WinnerCallout({
  narrative,
  demos,
}: {
  narrative: ComparisonNarrative;
  demos: DemoRun[];
}) {
  const winner = demos.find((d) => d.demo_id === narrative.winner_demo_id);
  return (
    <div
      style={{
        marginTop: 28,
        padding: "20px 22px",
        border: "0.5px solid rgba(0,0,0,0.08)",
        borderRadius: 12,
        background: "var(--cream)",
      }}
    >
      {winner && (
        <div
          style={{
            fontSize: 10,
            letterSpacing: "0.4px",
            textTransform: "uppercase",
            color: "var(--coral)",
            marginBottom: 6,
          }}
        >
          Winner — {winner.label}
        </div>
      )}
      <div
        className="serif"
        style={{
          fontSize: 22,
          color: "var(--ink)",
          letterSpacing: "-0.01em",
          marginBottom: 6,
          lineHeight: 1.25,
        }}
      >
        {narrative.headline}
      </div>
      <div style={{ fontSize: 13, color: "var(--ink-2)", lineHeight: 1.55 }}>
        {narrative.subhead}
      </div>
    </div>
  );
}

function TakeawaysGrid({
  narrative,
  demos,
}: {
  narrative: ComparisonNarrative;
  demos: DemoRun[];
}) {
  return (
    <div
      className="cortyze-compare-row"
      style={{ ...rowStyle, marginTop: 16 }}
    >
      {demos.map((d) => {
        const isWinner = d.demo_id === narrative.winner_demo_id;
        const bullets = narrative.demo_takeaways[d.demo_id] ?? [];
        return (
          <div
            key={d.demo_id}
            style={{
              flex: 1,
              minWidth: 0,
              border: `0.5px solid ${isWinner ? "var(--coral)" : "rgba(0,0,0,0.08)"}`,
              borderRadius: 12,
              padding: 14,
              background: "var(--cream)",
            }}
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: 500,
                color: isWinner ? "var(--coral)" : "var(--ink-2)",
                marginBottom: 10,
              }}
            >
              {d.label}
            </div>
            <ul
              style={{
                margin: 0,
                paddingLeft: 18,
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              {bullets.map((b, i) => (
                <li
                  key={i}
                  style={{
                    fontSize: 12,
                    color: "var(--ink-2)",
                    lineHeight: 1.5,
                  }}
                >
                  {b}
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

function NarrativeLoading() {
  return (
    <div
      style={{
        marginTop: 28,
        padding: "16px 18px",
        border: "0.5px solid rgba(0,0,0,0.06)",
        borderRadius: 12,
        background: "var(--cream)",
        fontSize: 12,
        color: "var(--ink-3)",
      }}
    >
      Building the side-by-side narrative…
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers + shared styles
// ---------------------------------------------------------------------------

const rowStyle: React.CSSProperties = {
  display: "flex",
  gap: 12,
  alignItems: "stretch",
};

const regionRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
};

function scoreFor(plan: SuggestionPlan, key: RegionKey): number {
  const r = plan.regions.find((x) => x.key === key);
  return r ? r.score : 0;
}

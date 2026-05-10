"use client";

import { useEffect, useRef, useState } from "react";

import { Badge } from "@/components/Badge";
import { BrainAtlas } from "@/components/BrainAtlas";
import { ExampleAdPlayer } from "@/components/ExampleAdPlayer";
import { VideoHero } from "@/components/VideoHero";
import { fetchExample } from "@/lib/api";
import { formatMSS } from "@/lib/format";
import { VideoPlayerProvider, useVideoSeek } from "@/lib/videoPlayer";
import {
  REGION_INFO,
  REGION_META,
  priorityStyle,
  severity,
  type ExampleAd,
  type Reference,
  type RegionKey,
  type RegionScore,
  type Suggestion,
  type SuggestionPlan,
} from "@/lib/cortyze-data";

// v2 region key → legacy 8-region key the manifest's region_scores
// dict is indexed by. Mirrors core/regions_v2.py LEGACY_TO_V2 inverted.
const V2_TO_LEGACY: Record<RegionKey, string> = {
  memory: "hippocampus",
  emotion: "amygdala",
  attention: "visual_cortex",
  language: "temporal_language",
  face: "fusiform_face",
  reward: "reward",
};


export function Results({
  plan,
  mediaUrl,
  onEdit,
}: {
  plan: SuggestionPlan;
  mediaUrl?: string | null;
  onEdit: () => void;
}) {
  const [openId, setOpenId] = useState<number | null>(
    plan.suggestions[0]?.id ?? null,
  );
  const [showAll, setShowAll] = useState(false);

  const visible = showAll ? plan.suggestions : plan.suggestions.slice(0, 4);
  const timeseries = plan.region_timeseries ?? null;

  return (
    <VideoPlayerProvider>
      <div
        className="fade-in"
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "28px 32px 60px",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 16,
            marginBottom: 24,
            flexWrap: "wrap",
          }}
        >
          <ScoreCard plan={plan} />
          <BreakdownCard
            regions={plan.regions}
            suggestions={plan.suggestions}
            timeseries={timeseries}
            mediaUrl={mediaUrl ?? null}
          />
        </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 14,
        }}
      >
        <div className="caption">How to improve — ranked by impact</div>
        <button
          onClick={onEdit}
          style={{
            fontSize: 12,
            fontWeight: 500,
            padding: "7px 18px",
            borderRadius: 20,
            background: "var(--coral)",
            color: "#fff",
            border: "none",
            transition: "background 150ms",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--coral-2)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "var(--coral)")}
        >
          Edit & re-score
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {visible.map((s, i) => (
          <SuggestionCard
            key={s.id}
            s={s}
            rank={i + 1}
            open={openId === s.id}
            onToggle={() => setOpenId(openId === s.id ? null : s.id)}
          />
        ))}
      </div>

      {!showAll && plan.suggestions.length > 4 && (
        <div style={{ textAlign: "center", marginTop: 14 }}>
          <button
            onClick={() => setShowAll(true)}
            style={{
              fontSize: 12,
              fontWeight: 500,
              color: "var(--coral)",
              background: "transparent",
              border: "none",
              padding: 8,
            }}
          >
            Show {plan.suggestions.length - 4} more suggestions
          </button>
        </div>
      )}

      <div
        style={{
          marginTop: 32,
          fontSize: 10,
          color: "var(--ink-3)",
          textAlign: "center",
        }}
      >
        Brain illustration:{" "}
        <a
          href="https://smart.servier.com/"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "inherit", textDecoration: "underline" }}
        >
          SMART by Servier
        </a>{" "}
        · CC BY 3.0
        </div>
      </div>
    </VideoPlayerProvider>
  );
}

function ScoreCard({ plan }: { plan: SuggestionPlan }) {
  const tone = plan.score < 50 ? "coral" : "green";

  return (
    <div
      className="card cortyze-score-card"
      style={{
        flex: "0 0 220px",
        width: 220,
        // Stretch to match the BreakdownCard's height (the parent flex
        // row's `align-items` defaults to `stretch`, so this just lets
        // the card grow alongside its sibling).
        alignSelf: "stretch",
        padding: 22,
        position: "relative",
        overflow: "hidden",
        // Match the upgraded framing used by the breakdown hero so
        // the two blocks read as a paired unit.
        border: "1.5px solid rgba(212,97,62,0.35)",
        borderRadius: 18,
        boxShadow:
          "0 1px 0 rgba(0,0,0,0.02), 0 12px 32px -16px rgba(212,97,62,0.25)",
        background: "rgba(255,255,255,0.85)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Score header + brain. On desktop this is a vertical stack
          (header on top, brain below in flex-grow space). On mobile
          the card goes full-width and this row swaps to horizontal so
          the brain fills the empty space to the right of the header
          instead of leaving the card half-empty. */}
      <div
        className="cortyze-score-top"
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
        }}
      >
        {/* Score header — anchored to the top of the card. */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div className="caption" style={{ color: "var(--ink)" }}>
            Cortyze score
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
            <span
              className="mono"
              style={{
                fontSize: 42,
                fontWeight: 600,
                color: "#000",
                letterSpacing: "-0.02em",
                lineHeight: 1,
              }}
            >
              {Math.round(plan.score)}
            </span>
            <span className="mono" style={{ fontSize: 18, color: "var(--ink-2)" }}>
              / 100
            </span>
          </div>
          <div style={{ fontSize: 11, color: "var(--ink-2)", fontWeight: 500 }}>
            Category avg:{" "}
            <span style={{ color: "var(--coral)", fontWeight: 600 }}>
              {Math.round(plan.benchmark)}
            </span>
          </div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 500,
              color: plan.delta >= 0 ? "var(--green)" : "var(--red)",
            }}
          >
            {plan.delta >= 0 ? "+" : ""}
            {plan.delta.toFixed(1)} vs last run
          </div>
          <div style={{ marginTop: 4 }}>
            <Badge tone={tone}>{plan.status}</Badge>
          </div>
        </div>

        {/* Brain illustration — sits in a flex-grow region so it
            centers vertically in whatever space remains between the
            score header above and the region list below. Without this,
            the card stretches to match its sibling and the brain ends
            up bunched against the score header with empty space below. */}
        <div
          className="cortyze-score-brain"
          style={{
            flex: 1,
            minHeight: 140,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            animation: "fadeIn 1s ease both",
          }}
        >
          <BrainAtlas size={170} showAll showBadges={false} />
        </div>
      </div>

      {/* Per-region scores + (i) info popovers, anchored to the
          bottom of the card. Hoisted out of the breakdown legend so
          they sit next to the brain that illustrates which region
          is which. */}
      <RegionScoreList regions={plan.regions} />
    </div>
  );
}

function BreakdownCard({
  regions,
  suggestions,
  timeseries,
  mediaUrl,
}: {
  regions: RegionScore[];
  suggestions: Suggestion[];
  timeseries: Record<RegionKey, number[]> | null;
  mediaUrl: string | null;
}) {
  // The (i) info popover used to live here next to per-row scores;
  // it's been hoisted into the ScoreCard's RegionScoreList so the
  // brain card carries the descriptive metadata. The legend below
  // the chart is now a pure color/name swatch list.
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

  // Duration of the clip (seconds) — taken from any region's series
  // since all rows share the same X scale. Drives the shared time
  // axis under the chart so users can read what second a peak lands at.
  const durationS =
    timeseries && Object.values(timeseries)[0]?.length
      ? Object.values(timeseries)[0].length
      : null;

  return (
    <div
      className="card"
      style={{
        flex: "1 1 480px",
        padding: 20,
        minWidth: 0,
        // Stronger framing than the default `.card` border so the
        // hero block (video + chart + legend) reads as a single
        // memorable unit rather than fading into the page.
        border: "1.5px solid rgba(212,97,62,0.35)",
        borderRadius: 18,
        boxShadow:
          "0 1px 0 rgba(0,0,0,0.02), 0 12px 32px -16px rgba(212,97,62,0.25)",
        background: "rgba(255,255,255,0.85)",
      }}
    >
      <div className="caption" style={{ marginBottom: 12 }}>
        What&apos;s driving your score
      </div>

      {mediaUrl && (
        <div style={{ marginBottom: 14 }}>
          <VideoHero mediaUrl={mediaUrl} />
        </div>
      )}

      {timeseries && durationS != null ? (
        // Combined view: one chart with 6 colored lines + shared
        // time axis + legend. Click anywhere on the chart to seek
        // the hero video; click a legend swatch's (i) for the
        // region's explanation popover.
        <div
          style={{ display: "flex", flexDirection: "column", gap: 10 }}
        >
          <CombinedRegionChart
            regions={regions}
            suggestions={suggestions}
            timeseries={timeseries}
            durationS={durationS}
          />
          <ChartTimeAxis durationS={durationS} />
          <RegionLegend regions={regions} />
        </div>
      ) : (
        // Fallback for runs without timeseries (real uploads in the
        // current build): the original 6-row layout with static bars.
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {regions.map((r) => (
            <BreakdownRow
              key={r.key}
              r={r}
              isOpen={openKey === r.key}
              onToggle={() => setOpenKey(openKey === r.key ? null : r.key)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function BreakdownRow({
  r,
  isOpen,
  onToggle,
}: {
  r: RegionScore;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const sev = severity(r.score, r.benchmark);
  const meta = REGION_META.find((m) => m.key === r.key)!;
  return (
    <div style={{ position: "relative" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div
          style={{
            width: 120,
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            gap: 5,
          }}
        >
          <span style={{ fontSize: 12, color: "var(--ink)" }}>{meta.label}</span>
          <button
            data-info-trigger
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            aria-label={`About ${meta.label}`}
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
            position: "relative",
            height: 6,
            background: "rgba(0,0,0,0.04)",
            borderRadius: 3,
          }}
        >
          <div
            style={{
              width: `${r.score}%`,
              height: "100%",
              background: sev.color,
              borderRadius: 3,
              transition: "width 600ms ease",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: `${r.benchmark}%`,
              top: -3,
              width: 1.5,
              height: 12,
              background: "rgba(0,0,0,0.2)",
              borderRadius: 1,
              transform: "translateX(-50%)",
            }}
          />
        </div>
        <div
          className="mono"
          style={{
            width: 28,
            fontSize: 12,
            fontWeight: 500,
            color: sev.color,
            textAlign: "right",
          }}
        >
          {Math.round(r.score)}
        </div>
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
            {meta.label}
          </div>
          {REGION_INFO[r.key]}
        </div>
      )}
    </div>
  );
}

function SuggestionCard({
  s,
  rank,
  open,
  onToggle,
}: {
  s: Suggestion;
  rank: number;
  open: boolean;
  onToggle: () => void;
}) {
  const region = REGION_META.find((m) => m.key === s.area)!;
  const pri = priorityStyle(s.priority);

  return (
    <div
      style={{
        borderRadius: 12,
        background: open ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.6)",
        border: "0.5px solid " + (open ? "rgba(212,97,62,0.2)" : "var(--rule)"),
        transition: "all 180ms",
      }}
      onMouseEnter={(e) => {
        if (!open) e.currentTarget.style.background = "rgba(255,255,255,0.85)";
      }}
      onMouseLeave={(e) => {
        if (!open) e.currentTarget.style.background = "rgba(255,255,255,0.6)";
      }}
    >
      <button
        onClick={onToggle}
        style={{
          width: "100%",
          textAlign: "left",
          background: "transparent",
          border: "none",
          padding: "14px 16px",
          display: "flex",
          alignItems: "center",
          gap: 14,
        }}
      >
        <div
          style={{
            width: 24,
            height: 24,
            borderRadius: "50%",
            background: pri.bg,
            color: pri.fg,
            display: "grid",
            placeItems: "center",
            fontSize: 12,
            fontWeight: 500,
            flexShrink: 0,
          }}
        >
          {rank}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: "var(--ink)",
              marginBottom: 3,
            }}
          >
            {s.title}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span
              style={{
                fontSize: 10,
                padding: "2px 8px",
                borderRadius: 10,
                background: "rgba(0,0,0,0.04)",
                color: "#888",
              }}
            >
              {region.label}
            </span>
            <span
              style={{
                fontSize: 11,
                color: "var(--green)",
                fontWeight: 500,
              }}
            >
              +{s.lift.toFixed(1)} expected lift
            </span>
          </div>
        </div>

        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          style={{
            color: open ? "var(--coral)" : "#ccc",
            transform: open ? "rotate(90deg)" : "rotate(0deg)",
            transition: "transform 180ms, color 180ms",
            flexShrink: 0,
          }}
        >
          <path
            d="M5 3l4 4-4 4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <div
          className="fade-up"
          style={{
            padding: "0 16px 16px 50px",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <div
            style={{
              display: "flex",
              gap: 14,
              alignItems: "stretch",
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                width: 160,
                flexShrink: 0,
                alignSelf: "stretch",
                background: "var(--sand)",
                borderRadius: 10,
                padding: 10,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <BrainAtlas
                size={140}
                pulseKey={region.key}
                showBadges={false}
              />
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 500,
                  color: "var(--coral)",
                  textTransform: "uppercase",
                  letterSpacing: "0.3px",
                  textAlign: "center",
                }}
              >
                {region.sci}
              </div>
              <div
                style={{
                  fontSize: 8,
                  color: "var(--ink-3)",
                  textAlign: "center",
                }}
              >
                {region.role}
              </div>
            </div>

            <div
              style={{
                flex: "1 1 220px",
                minWidth: 0,
                fontSize: 12,
                color: "var(--ink-2)",
                lineHeight: 1.55,
              }}
            >
              {s.explanation}
              {s.peak_start_s != null && s.peak_end_s != null && (
                <div
                  style={{
                    marginTop: 10,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    flexWrap: "wrap",
                  }}
                >
                  <span
                    style={{
                      fontSize: 11,
                      color: "var(--ink-3)",
                      letterSpacing: "0.02em",
                    }}
                  >
                    Watch this moment in your clip:
                  </span>
                  <TimestampPill seconds={s.peak_start_s} />
                  <span style={{ fontSize: 11, color: "var(--ink-3)" }}>–</span>
                  <TimestampPill seconds={s.peak_end_s} />
                </div>
              )}
              <SuggestionExample s={s} open={open} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Always renders a library example if the backend ships one. Never
// falls back to the static `reference` (the legacy trends-mock card) —
// caller is responsible for ensuring `examples` is populated.
function SuggestionExample({ s, open }: { s: Suggestion; open: boolean }) {
  const firstSlug = s.examples?.[0];
  const [ad, setAd] = useState<ExampleAd | null>(null);

  useEffect(() => {
    if (!open || !firstSlug) return;
    let cancelled = false;
    fetchExample(firstSlug)
      .then((res) => {
        if (!cancelled) setAd(res);
      })
      .catch(() => {
        /* swallow — better to show nothing than a misleading mock card */
      });
    return () => {
      cancelled = true;
    };
  }, [open, firstSlug]);

  if (!firstSlug || !ad) return null;
  return <LibraryReferenceCard ad={ad} area={s.area} />;
}

function LibraryReferenceCard({
  ad,
  area,
}: {
  ad: ExampleAd;
  area: RegionKey;
}) {
  const legacyKey = V2_TO_LEGACY[area];
  const regionScore = Math.round(ad.region_scores?.[legacyKey] ?? 0);
  const overall = Math.round(
    Math.max(0, ...Object.values(ad.overall_by_goal ?? {})),
  );
  const regionLabel =
    REGION_META.find((m) => m.key === area)?.label ?? area;
  // Peak window for this region in the example ad — keyed by the
  // legacy 8-region label since that's how reference manifests are
  // indexed. Falls back to the static thumbnail when missing.
  const peakWindow = ad.peak_windows?.[legacyKey];

  return (
    <div
      className="cortyze-example-card"
      style={{
        marginTop: 10,
        background: "var(--sand)",
        borderRadius: 8,
        padding: "10px 12px",
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        flexWrap: "wrap",
      }}
    >
      {peakWindow && ad.source_url ? (
        <ExampleAdPlayer
          src={ad.source_url}
          startS={peakWindow[0]}
          endS={peakWindow[1]}
        />
      ) : (
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 6,
            background: ad.thumbnail_url ? "transparent" : "#D9D5CE",
            display: "grid",
            placeItems: "center",
            flexShrink: 0,
            overflow: "hidden",
          }}
        >
          {ad.thumbnail_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={ad.thumbnail_url}
              alt={ad.display_name}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#888"
              strokeWidth="1.5"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="9" cy="9" r="2" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
          )}
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 500, color: "var(--ink)" }}>
          {ad.display_name}
        </div>
        {ad.description && (
          <div
            style={{
              fontSize: 10,
              color: "#888",
              marginTop: 1,
            }}
          >
            {ad.description}
          </div>
        )}
        <div style={{ display: "flex", gap: 14, marginTop: 6 }}>
          <ScorePair value={regionScore} label={regionLabel} />
          <ScorePair value={overall} label="Overall" />
        </div>
      </div>
    </div>
  );
}

function ReferenceCard({ data }: { data: Reference }) {
  return (
    <div
      style={{
        marginTop: 10,
        background: "var(--sand)",
        borderRadius: 8,
        padding: "10px 12px",
        display: "flex",
        alignItems: "center",
        gap: 10,
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 6,
          background: "#D9D5CE",
          display: "grid",
          placeItems: "center",
          flexShrink: 0,
        }}
      >
        <svg
          width="20"
          height="20"
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
        <div style={{ fontSize: 11, fontWeight: 500, color: "var(--ink)" }}>
          {data.brand} · {data.campaign}
        </div>
        <div style={{ fontSize: 10, color: "#888", marginTop: 1 }}>
          {data.note}
        </div>
        <div style={{ display: "flex", gap: 14, marginTop: 6 }}>
          <ScorePair value={data.scoreA} label={data.labelA} />
          <ScorePair value={data.scoreB} label={data.labelB} />
        </div>
      </div>
    </div>
  );
}

function ScorePair({ value, label }: { value: number; label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
      <span
        className="mono"
        style={{ fontSize: 11, fontWeight: 500, color: "var(--green)" }}
      >
        {value}
      </span>
      <span
        style={{
          fontSize: 9,
          textTransform: "uppercase",
          letterSpacing: "0.3px",
          color: "var(--ink-3)",
        }}
      >
        {label}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Combined region chart — single SVG with 6 colored polylines, one per
// brain region. Replaces the 6 separate sparklines when the run has a
// `region_timeseries`. Click anywhere → seek the hero video.
// ---------------------------------------------------------------------------

// Layout constants shared by CombinedRegionChart and ChartTimeAxis so
// their X axes line up exactly. The chart reserves a left gutter for
// Y-axis amplitude labels; the time axis below has to match that
// gutter or its tick labels will drift left of the plot area.
const CHART_LEFT_GUTTER = 28;
const CHART_TOP_PAD = 28;
const CHART_PLOT_HEIGHT = 220;

// Categorical palette assigned to each region in the multi-line chart
// + matching legend swatches. Hand-picked to stay readable on cream,
// sit comfortably with the brand coral, and survive desaturation.
const REGION_COLORS: Record<RegionKey, string> = {
  memory: "#3a7d6e",   // teal
  emotion: "#d4613e",  // coral (brand)
  attention: "#c08530", // ochre
  language: "#7d4f7a", // plum
  face: "#3a6a8a",     // navy
  reward: "#7a8845",   // olive
};

function CombinedRegionChart({
  regions,
  suggestions,
  timeseries,
  durationS,
}: {
  regions: RegionScore[];
  suggestions: Suggestion[];
  timeseries: Record<RegionKey, number[]>;
  durationS: number;
}) {
  const seek = useVideoSeek();
  const [hoverX, setHoverX] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Render order = regions order from the plan. Drawn back-to-front so
  // higher-priority regions sit on top; we don't have a ranking here,
  // so just preserve the plan's order.
  const W = durationS;
  const H = 100;

  // Notable peaks — one marker per suggestion that has a peak window.
  // The dot snaps to the curve's ACTUAL maximum within
  // [peak_start_s, peak_end_s], not the window's midpoint. After
  // smoothing, the true maximum can drift a second or two off-center,
  // so anchoring on the midpoint produced dots that visibly missed
  // the peak. Scanning the window guarantees the dot lands on the
  // tallest point of the curve in the suggestion's range.
  const markers = suggestions
    .filter(
      (s) =>
        s.peak_start_s != null &&
        s.peak_end_s != null &&
        timeseries[s.area]?.length,
    )
    .map((s) => {
      const samples = timeseries[s.area];
      const lo = Math.max(0, Math.floor(s.peak_start_s as number));
      const hi = Math.min(samples.length - 1, Math.ceil(s.peak_end_s as number));
      let peakIdx = lo;
      let peakVal = -Infinity;
      for (let i = lo; i <= hi; i++) {
        if (samples[i] > peakVal) {
          peakVal = samples[i];
          peakIdx = i;
        }
      }
      return {
        id: s.id,
        sec: peakIdx,
        value: peakVal,
        regionKey: s.area,
        label: REGION_META.find((m) => m.key === s.area)?.label ?? s.area,
      };
    });

  function clientToSecond(clientX: number): number {
    // The SVG itself starts AFTER the left gutter, so clientX maps
    // directly to its bounding box without any extra offset.
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return 0;
    const ratio = (clientX - rect.left) / Math.max(1, rect.width);
    return Math.round(Math.max(0, Math.min(1, ratio)) * (durationS - 1));
  }

  return (
    <div
      style={{
        position: "relative",
        // Reserve extra top padding for the peak-marker labels that
        // float just above the plot area, and a left gutter for the
        // Y-axis amplitude labels (0–100).
        paddingTop: 28,
        paddingLeft: CHART_LEFT_GUTTER,
        height: 248,
        cursor: "pointer",
      }}
      onMouseLeave={() => setHoverX(null)}
      onMouseMove={(e) => setHoverX(clientToSecond(e.clientX))}
      onClick={(e) => seek(clientToSecond(e.clientX))}
    >
      {/* Y-axis labels — sit in the left gutter, vertically aligned to
          the gridlines drawn inside the SVG (0/25/50/75/100). The plot
          area is `CHART_PLOT_HEIGHT` tall and starts at `CHART_TOP_PAD`
          below the container top. */}
      {[0, 25, 50, 75, 100].map((v) => (
        <div
          key={v}
          style={{
            position: "absolute",
            left: 0,
            top:
              CHART_TOP_PAD + ((100 - v) / 100) * CHART_PLOT_HEIGHT,
            width: CHART_LEFT_GUTTER - 6,
            textAlign: "right",
            fontSize: 9,
            color: "var(--ink-3)",
            fontVariantNumeric: "tabular-nums",
            transform: "translateY(-50%)",
            pointerEvents: "none",
          }}
        >
          {v}
        </div>
      ))}
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        style={{
          width: "100%",
          // Pin to exactly CHART_PLOT_HEIGHT so the SVG's plot area
          // matches the same height the marker dot positions assume.
          // `calc(100% - 28px)` worked under content-box sizing, but
          // globals.css enables `box-sizing: border-box` globally —
          // which made the SVG resolve to ~192px and dropped the
          // dots ~10 score points below the actual line peaks.
          height: CHART_PLOT_HEIGHT,
          display: "block",
        }}
      >
        {/* Subtle horizontal grid at 25/50/75% so the eye can read amplitude. */}
        {[25, 50, 75].map((y) => (
          <line
            key={y}
            x1={0}
            x2={W}
            y1={y}
            y2={y}
            stroke="rgba(0,0,0,0.05)"
            strokeWidth={0.5}
          />
        ))}
        {/* Faint guide line dropping from each peak marker label down
            to the dot on the region's curve. */}
        {markers.map((m) => (
          <line
            key={`guide-${m.id}`}
            x1={m.sec}
            x2={m.sec}
            y1={0}
            y2={H - m.value}
            stroke={REGION_COLORS[m.regionKey]}
            strokeWidth={0.5}
            strokeDasharray="2 2"
            opacity={0.5}
            vectorEffect="non-scaling-stroke"
          />
        ))}
        {regions.map((r) => {
          const samples = timeseries[r.key];
          if (!samples || samples.length === 0) return null;
          return (
            <polyline
              key={r.key}
              points={polylinePath(samples, W, H)}
              fill="none"
              stroke={REGION_COLORS[r.key]}
              strokeWidth={1.4}
              strokeLinejoin="round"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
              opacity={0.85}
            />
          );
        })}
        {/* Peak dots are rendered as HTML elements in the overlay
            below — drawing them inside this stretched SVG turned them
            into ovals. */}
        {hoverX != null && (
          <line
            x1={hoverX}
            x2={hoverX}
            y1={0}
            y2={H}
            stroke="rgba(0,0,0,0.35)"
            strokeWidth={0.5}
            vectorEffect="non-scaling-stroke"
          />
        )}
      </svg>

      {/* Overlay sized exactly to the SVG plot area — the labels
          inside use `left: pct%` which now maps to the plot's
          horizontal extent rather than the whole container (which
          would push them left by `CHART_LEFT_GUTTER`). */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: CHART_LEFT_GUTTER,
          right: 0,
          height: "100%",
          pointerEvents: "none",
        }}
      >
        {/* Floating peak labels above the chart — one per suggestion.
            Click jumps the video to the peak. */}
        {markers.map((m) => (
          <button
            key={`label-${m.id}`}
            onClick={(e) => {
              e.stopPropagation();
              seek(m.sec);
            }}
            style={{
              position: "absolute",
              top: 0,
              left: `${(m.sec / Math.max(1, durationS - 1)) * 100}%`,
              transform: "translateX(-50%)",
              fontSize: 9,
              fontWeight: 500,
              letterSpacing: "0.02em",
              color: REGION_COLORS[m.regionKey],
              background: "var(--cream)",
              border: `0.5px solid ${REGION_COLORS[m.regionKey]}`,
              borderRadius: 8,
              padding: "1px 6px",
              cursor: "pointer",
              whiteSpace: "nowrap",
              fontFamily: "inherit",
              pointerEvents: "auto",
            }}
            title={`${m.label} peak — click to play`}
          >
            {m.label} · {formatMSS(m.sec)}
          </button>
        ))}
        {/* Peak dots as HTML circles — true round shapes regardless of
            the chart's stretched SVG aspect ratio. Sized in pixels,
            positioned in % of the plot area. */}
        {markers.map((m) => (
          <div
            key={`dot-${m.id}`}
            aria-hidden="true"
            style={{
              position: "absolute",
              left: `${(m.sec / Math.max(1, durationS - 1)) * 100}%`,
              // Y position is `CHART_TOP_PAD + (100 - value)% * CHART_PLOT_HEIGHT`
              // measured from the overlay's top (which sits at the
              // chart container's top, ABOVE the gutter padding).
              top:
                CHART_TOP_PAD +
                ((100 - m.value) / 100) * CHART_PLOT_HEIGHT,
              width: 9,
              height: 9,
              borderRadius: "50%",
              background: REGION_COLORS[m.regionKey],
              border: "1.5px solid var(--cream)",
              transform: "translate(-50%, -50%)",
            }}
          />
        ))}
        {hoverX != null && (
          <div
            style={{
              position: "absolute",
              top: -8,
              left: `${(hoverX / Math.max(1, durationS - 1)) * 100}%`,
              transform: "translateX(-50%)",
              fontSize: 10,
              color: "var(--ink-3)",
              background: "var(--cream)",
              padding: "1px 6px",
              borderRadius: 4,
              whiteSpace: "nowrap",
              border: "0.5px solid rgba(0,0,0,0.06)",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {formatMSS(hoverX)}
          </div>
        )}
      </div>
    </div>
  );
}

// Time axis under the combined chart. The 5 evenly spaced labels
// align with the chart's X scale — that means matching the chart's
// left gutter so the tick at "0:00" sits flush with second 0 of the
// plot area, not the container edge.
function ChartTimeAxis({ durationS }: { durationS: number }) {
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((p) => ({
    pct: p,
    seconds: Math.round(p * Math.max(0, durationS - 1)),
  }));
  return (
    <div
      style={{
        position: "relative",
        height: 14,
        marginLeft: CHART_LEFT_GUTTER,
      }}
    >
      {ticks.map((t, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: `${t.pct * 100}%`,
            transform:
              i === 0
                ? "translateX(0)"
                : i === ticks.length - 1
                  ? "translateX(-100%)"
                  : "translateX(-50%)",
            fontSize: 9,
            color: "var(--ink-3)",
            fontVariantNumeric: "tabular-nums",
            whiteSpace: "nowrap",
          }}
        >
          {formatMSS(t.seconds)}
        </div>
      ))}
    </div>
  );
}

// Per-region score + (i) info popover list. Lives in the ScoreCard
// under the brain, so a viewer can map "this region of the brain →
// this score → what does it mean" in a single glance, without
// hunting through the chart legend.
function RegionScoreList({ regions }: { regions: RegionScore[] }) {
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
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {regions.map((r) => {
        const meta = REGION_META.find((m) => m.key === r.key)!;
        const sev = severity(r.score, r.benchmark);
        const isOpen = openKey === r.key;
        return (
          <div key={r.key} style={{ position: "relative" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 11,
                color: "var(--ink)",
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 2,
                  background: REGION_COLORS[r.key],
                  flexShrink: 0,
                }}
              />
              <span style={{ flex: 1, minWidth: 0 }}>{meta.label}</span>
              <button
                data-info-trigger
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenKey(isOpen ? null : r.key);
                }}
                aria-label={`About ${meta.label}`}
                style={{
                  width: 13,
                  height: 13,
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
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
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
              <span
                className="mono"
                style={{
                  fontSize: 11,
                  fontWeight: 500,
                  color: sev.color,
                  fontVariantNumeric: "tabular-nums",
                  width: 22,
                  textAlign: "right",
                }}
              >
                {Math.round(r.score)}
              </span>
            </div>
            {isOpen && (
              <div
                data-info-popover
                className="fade-up"
                style={{
                  position: "absolute",
                  // Anchor to the right so the popover stays inside
                  // the score card's narrow 220px column.
                  top: 22,
                  right: 0,
                  zIndex: 10,
                  background: "#FAFAF7",
                  border: "0.5px solid rgba(0,0,0,0.1)",
                  borderRadius: 8,
                  padding: "10px 12px",
                  fontSize: 11,
                  color: "#555",
                  lineHeight: 1.5,
                  width: 220,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 500,
                    color: "var(--ink)",
                    marginBottom: 4,
                  }}
                >
                  {meta.label}
                </div>
                {REGION_INFO[r.key]}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Lightweight legend below the combined chart — colored swatch + region
// name only. Scores and the (i) info popovers live next to the brain
// in the ScoreCard now, so the legend just helps the eye map a line
// color to a region.
function RegionLegend({ regions }: { regions: RegionScore[] }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
        gap: "6px 14px",
        marginTop: 4,
      }}
    >
      {regions.map((r) => {
        const meta = REGION_META.find((m) => m.key === r.key)!;
        return (
          <div
            key={r.key}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              fontSize: 11,
              color: "var(--ink-2)",
            }}
          >
            <span
              aria-hidden="true"
              style={{
                width: 10,
                height: 10,
                borderRadius: 2,
                background: REGION_COLORS[r.key],
                flexShrink: 0,
              }}
            />
            <span>{meta.label}</span>
          </div>
        );
      })}
    </div>
  );
}

function polylinePath(samples: number[], W: number, H: number): string {
  if (samples.length === 0) return "";
  const stepX = W / Math.max(1, samples.length - 1);
  return samples
    .map((v, i) => {
      const x = (i * stepX).toFixed(2);
      // Invert Y because SVG origin is top-left.
      const y = (H - Math.max(0, Math.min(100, v))).toFixed(2);
      return `${x},${y}`;
    })
    .join(" ");
}

// ---------------------------------------------------------------------------
// Timestamp pill — clickable seek anchor used in suggestion bodies
// ---------------------------------------------------------------------------

function TimestampPill({ seconds }: { seconds: number }) {
  const seek = useVideoSeek();
  return (
    <button
      onClick={() => seek(seconds)}
      style={{
        fontSize: 11,
        fontWeight: 500,
        color: "var(--coral)",
        background: "var(--coral-tint)",
        border: "0.5px solid rgba(212,97,62,0.25)",
        borderRadius: 12,
        padding: "3px 9px",
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        fontFamily: "inherit",
      }}
    >
      <span style={{ fontSize: 9 }}>▶</span>
      <span className="mono">{formatMSS(seconds)}</span>
    </button>
  );
}

"use client";

import { useEffect, useState } from "react";

import { Badge } from "@/components/Badge";
import { BrainAtlas } from "@/components/BrainAtlas";
import { ExampleAdPlayer } from "@/components/ExampleAdPlayer";
import { fetchExample } from "@/lib/api";
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
  onEdit,
}: {
  plan: SuggestionPlan;
  onEdit: () => void;
}) {
  const [openId, setOpenId] = useState<number | null>(
    plan.suggestions[0]?.id ?? null,
  );
  const [showAll, setShowAll] = useState(false);

  const visible = showAll ? plan.suggestions : plan.suggestions.slice(0, 4);

  return (
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
        <BreakdownCard regions={plan.regions} />
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
  );
}

function ScoreCard({ plan }: { plan: SuggestionPlan }) {
  const tone = plan.score < 50 ? "coral" : "green";

  return (
    <div
      className="card"
      style={{
        flex: "0 0 220px",
        width: 220,
        height: 220,
        padding: 22,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: 0.35,
          pointerEvents: "none",
          animation: "fadeIn 1s ease both",
        }}
      >
        <BrainAtlas size={200} showAll showBadges={false} />
      </div>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(255,255,255,0.78)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
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
    </div>
  );
}

function BreakdownCard({ regions }: { regions: RegionScore[] }) {
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
    <div className="card" style={{ flex: 1, padding: 20, minWidth: 360 }}>
      <div className="caption" style={{ marginBottom: 12 }}>
        What&apos;s driving your score
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {regions.map((r) => (
          <BreakdownRow
            key={r.key}
            r={r}
            isOpen={openKey === r.key}
            onToggle={() => setOpenKey(openKey === r.key ? null : r.key)}
          />
        ))}
      </div>
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
          <div style={{ display: "flex", gap: 14, alignItems: "stretch" }}>
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
                flex: 1,
                fontSize: 12,
                color: "var(--ink-2)",
                lineHeight: 1.55,
              }}
            >
              {s.explanation}
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
      style={{
        marginTop: 10,
        background: "var(--sand)",
        borderRadius: 8,
        padding: "10px 12px",
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
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

"use client";

import type { CSSProperties } from "react";

import { I } from "./Icons";
import { petColor } from "@/lib/lab/petColor";
import type { LabHistoryItem } from "@/lib/lab/data";

const sidebarStyles: Record<string, CSSProperties> = {
  rail: {
    height: "100vh",
    background: "#FBFBF9",
    borderRight: "1px solid var(--rule)",
    display: "flex",
    flexDirection: "column",
    transition: "width 220ms cubic-bezier(.4,0,.2,1)",
    overflow: "hidden",
    position: "relative",
    flexShrink: 0,
  },
  group: {
    fontFamily: "var(--font-jbm), monospace",
    fontSize: 9,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: "var(--ink-3)",
    padding: "14px 16px 6px",
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  divider: {
    height: 1,
    background: "var(--rule-2)",
    margin: "0 16px",
  },
};

function MiniThumb({ kind, score }: { kind: LabHistoryItem["thumb"]; score: number }) {
  const c = petColor(score);
  if (kind === "wellness") {
    return (
      <svg width="28" height="28" viewBox="0 0 28 28" style={{ flexShrink: 0 }}>
        <rect x="0" y="0" width="28" height="28" fill="#F2F1EC" />
        <rect x="9" y="6" width="10" height="16" fill="none" stroke="#1A1A1B" strokeWidth="0.7" />
        <rect x="11" y="3" width="6" height="3" fill="none" stroke="#1A1A1B" strokeWidth="0.7" />
        <line x1="11" y1="10" x2="17" y2="10" stroke="#1A1A1B" strokeWidth="0.4" />
        <circle cx="22" cy="22" r="3" fill={c} opacity="0.7" />
      </svg>
    );
  }
  if (kind === "wellness2") {
    return (
      <svg width="28" height="28" viewBox="0 0 28 28">
        <rect x="0" y="0" width="28" height="28" fill="#F2F1EC" />
        <circle cx="9" cy="14" r="6" fill="none" stroke="#1A1A1B" strokeWidth="0.7" />
        <circle cx="19" cy="14" r="6" fill="none" stroke="#1A1A1B" strokeWidth="0.7" />
        <circle cx="14" cy="14" r="2" fill={c} opacity="0.8" />
      </svg>
    );
  }
  if (kind === "video") {
    return (
      <svg width="28" height="28" viewBox="0 0 28 28">
        <rect x="0" y="0" width="28" height="28" fill="#F2F1EC" />
        <rect x="3" y="6" width="22" height="16" fill="none" stroke="#1A1A1B" strokeWidth="0.7" />
        <path d="M11 11l6 3-6 3z" fill="#1A1A1B" />
        <circle cx="22" cy="9" r="1.5" fill={c} />
      </svg>
    );
  }
  if (kind === "portrait") {
    return (
      <svg width="28" height="28" viewBox="0 0 28 28">
        <rect x="0" y="0" width="28" height="28" fill="#F2F1EC" />
        <circle cx="14" cy="11" r="4" fill="none" stroke="#1A1A1B" strokeWidth="0.7" />
        <path d="M5 24c2-5 6-7 9-7s7 2 9 7" fill="none" stroke="#1A1A1B" strokeWidth="0.7" />
      </svg>
    );
  }
  return <div style={{ width: 28, height: 28, background: "#F2F1EC" }} />;
}

function ScoreBadge({ score }: { score: number }) {
  const c = petColor(score);
  return (
    <div
      className="lab-mono"
      style={{
        fontSize: 10,
        color: "var(--ink-2)",
        display: "flex",
        alignItems: "center",
        gap: 4,
      }}
    >
      <span style={{ display: "inline-block", width: 5, height: 5, background: c }} />
      {score.toFixed(1)}
    </div>
  );
}

function NavItem({
  icon,
  label,
  active,
  collapsed,
  onClick,
  dim,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  collapsed: boolean;
  onClick?: () => void;
  dim?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={dim}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: collapsed ? "8px" : "7px 10px",
        border: "none",
        background: active ? "#1A1A1B" : "transparent",
        color: active ? "#F9F9F7" : dim ? "var(--ink-4)" : "var(--ink-2)",
        fontSize: 12,
        fontWeight: 500,
        cursor: dim ? "default" : "pointer",
        justifyContent: collapsed ? "center" : "flex-start",
        position: "relative",
        whiteSpace: "nowrap",
        textAlign: "left",
      }}
    >
      {icon}
      {!collapsed && <span>{label}</span>}
      {!collapsed && active && (
        <span className="lab-mono" style={{ marginLeft: "auto", fontSize: 9, opacity: 0.7 }}>
          ↵
        </span>
      )}
    </button>
  );
}

export type SidebarView = "bench" | "compare";

export function Sidebar({
  collapsed,
  onToggle,
  history,
  currentRunId,
  onSelectRun,
  onNew,
  view,
  setView,
}: {
  collapsed: boolean;
  onToggle: () => void;
  history: LabHistoryItem[];
  currentRunId: string;
  onSelectRun: (id: string) => void;
  onNew: () => void;
  view: SidebarView;
  setView: (v: SidebarView) => void;
}) {
  const W = collapsed ? 56 : 248;

  const groups: Record<string, LabHistoryItem[]> = {};
  history.forEach((h) => {
    const day = h.ts.split(",")[0];
    (groups[day] = groups[day] || []).push(h);
  });

  return (
    <aside style={{ ...sidebarStyles.rail, width: W }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "14px 14px 10px",
          borderBottom: "1px solid var(--rule)",
          height: 49,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: 22,
            height: 22,
            position: "relative",
            flexShrink: 0,
            display: "grid",
            placeItems: "center",
            border: "1px solid var(--ink)",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14">
            <path d="M11 4a4 4 0 1 0 0 6" fill="none" stroke="#1A1A1B" strokeWidth="1.4" />
            <circle cx="7" cy="7" r="1" fill="#2D7071" />
          </svg>
        </div>
        {!collapsed && (
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: "-0.01em" }}>Cortyze</div>
            <div className="lab-mono" style={{ fontSize: 9, color: "var(--ink-3)", letterSpacing: "0.08em" }}>
              NEURAL AUDIT · v2.4
            </div>
          </div>
        )}
        <button
          onClick={onToggle}
          style={{
            width: 22,
            height: 22,
            border: "1px solid var(--rule)",
            background: "transparent",
            color: "var(--ink-2)",
            display: "grid",
            placeItems: "center",
            padding: 0,
          }}
          title={collapsed ? "Expand" : "Collapse"}
        >
          {collapsed ? <I.Expand size={11} /> : <I.Collapse size={11} />}
        </button>
      </div>

      <div style={{ padding: "10px 8px 6px", display: "flex", flexDirection: "column", gap: 2 }}>
        <NavItem
          icon={<I.Beaker size={13} />}
          label="Lab Bench"
          active={view === "bench"}
          collapsed={collapsed}
          onClick={() => setView("bench")}
        />
        <NavItem
          icon={<I.Compare size={13} />}
          label="A/B Audit"
          active={view === "compare"}
          collapsed={collapsed}
          onClick={() => setView("compare")}
        />
        <NavItem icon={<I.Brain size={13} />} label="Region atlas" collapsed={collapsed} dim />
        <NavItem icon={<I.Settings size={13} />} label="Settings" collapsed={collapsed} dim />
      </div>

      <div style={sidebarStyles.divider} />

      <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
        {!collapsed && (
          <div
            style={{
              padding: "10px 16px 6px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div className="lab-mono" style={{ fontSize: 9, letterSpacing: "0.12em", color: "var(--ink-3)" }}>
              RUN ARCHIVE · {history.length}
            </div>
            <button
              onClick={onNew}
              style={{ border: "none", background: "transparent", padding: 2, color: "var(--ink-2)" }}
              title="New run"
            >
              <I.Plus size={12} />
            </button>
          </div>
        )}

        {collapsed ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "8px 0", alignItems: "center" }}>
            {history.slice(0, 6).map((h) => (
              <button
                key={h.id}
                onClick={() => onSelectRun(h.id)}
                style={{
                  width: 32,
                  height: 32,
                  border: h.id === currentRunId ? "1px solid var(--ink)" : "1px solid var(--rule)",
                  background: "transparent",
                  padding: 0,
                  position: "relative",
                }}
                title={h.title}
              >
                <MiniThumb kind={h.thumb} score={h.score} />
              </button>
            ))}
          </div>
        ) : (
          Object.entries(groups).map(([day, items]) => (
            <div key={day}>
              <div style={sidebarStyles.group}>{day}</div>
              <div style={{ padding: "0 8px 8px" }}>
                {items.map((h) => (
                  <button
                    key={h.id}
                    onClick={() => onSelectRun(h.id)}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      background: h.id === currentRunId ? "#F2F1EC" : "transparent",
                      border: "none",
                      padding: "8px 8px",
                      display: "flex",
                      gap: 10,
                      alignItems: "flex-start",
                      cursor: "pointer",
                      position: "relative",
                    }}
                  >
                    {h.id === currentRunId && (
                      <div
                        style={{
                          position: "absolute",
                          left: 0,
                          top: 8,
                          bottom: 8,
                          width: 2,
                          background: "var(--teal)",
                        }}
                      />
                    )}
                    <MiniThumb kind={h.thumb} score={h.score} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 12,
                          color: "var(--ink)",
                          fontWeight: 500,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {h.title}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
                        <ScoreBadge score={h.score} />
                        <span className="lab-mono" style={{ fontSize: 9, color: "var(--ink-4)" }}>
                          {h.ts.split(", ")[1]}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              <div style={sidebarStyles.divider} />
            </div>
          ))
        )}
      </div>

      {!collapsed && (
        <div
          style={{
            borderTop: "1px solid var(--rule)",
            padding: "10px 14px",
            display: "flex",
            alignItems: "center",
            gap: 10,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: 22,
              height: 22,
              background: "#E4ECEB",
              border: "1px solid var(--rule)",
              display: "grid",
              placeItems: "center",
              fontSize: 10,
              fontWeight: 600,
              color: "var(--teal-2)",
            }}
          >
            SK
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 500 }}>S. Kahn</div>
            <div className="lab-mono" style={{ fontSize: 9, color: "var(--ink-3)" }}>
              Lumen Skincare · Lead
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}

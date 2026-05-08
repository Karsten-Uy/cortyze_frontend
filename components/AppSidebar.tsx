"use client";

import { severity, type PastRun } from "@/lib/cortyze-data";

export function AppSidebar({
  runs,
  currentId,
  onSelect,
}: {
  runs: PastRun[];
  currentId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <aside
      style={{
        width: 190,
        flexShrink: 0,
        borderRight: "0.5px solid rgba(0,0,0,0.08)",
        padding: 16,
        display: "flex",
        flexDirection: "column",
        gap: 10,
        overflowY: "auto",
      }}
    >
      <div className="caption">Past runs</div>
      {runs.length === 0 && (
        <div
          style={{
            fontSize: 11,
            color: "var(--ink-3)",
            lineHeight: 1.5,
            padding: "4px 2px",
          }}
        >
          Your previous analyses will appear here.
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {runs.map((r) => {
          const sev = severity(r.score, 64);
          const isActive = r.id === currentId;
          return (
            <button
              key={r.id}
              onClick={() => onSelect(r.id)}
              style={{
                textAlign: "left",
                padding: 10,
                borderRadius: 8,
                border: "none",
                background: isActive ? "rgba(212,97,62,0.08)" : "transparent",
                display: "flex",
                flexDirection: "column",
                gap: 2,
                transition: "background 120ms",
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.background = "rgba(0,0,0,0.03)";
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.background = "transparent";
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: "var(--ink)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {r.name}
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  gap: 6,
                }}
              >
                <span style={{ fontSize: 11, color: "var(--ink-3)" }}>
                  {r.date} · {r.kind}
                </span>
                <span
                  className="mono"
                  style={{
                    fontSize: 11,
                    fontWeight: 500,
                    color: sev.color,
                  }}
                >
                  {r.score}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </aside>
  );
}

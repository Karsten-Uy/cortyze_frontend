"use client";

import { severity, type PastRun } from "@/lib/cortyze-data";

const COLLAPSED_WIDTH = 56;
const EXPANDED_WIDTH = 200;

export function AppSidebar({
  runs,
  currentId,
  onSelect,
  expanded,
  onExpandedChange,
  mobileOpen = false,
  onMobileClose,
}: {
  runs: PastRun[];
  currentId: string | null;
  onSelect: (id: string) => void;
  // Desktop collapsed/expanded. Lifted to the page so nav actions
  // (e.g., clicking Lab bench) can also collapse it.
  expanded: boolean;
  onExpandedChange: (next: boolean) => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}) {
  // Collapsed by default — only the hamburger shows. Click expands.
  // Hidden entirely on mobile via the `.cortyze-sidebar` rule in
  // globals.css unless `mobileOpen` is true (drawer overlay).
  const showContent = expanded || mobileOpen;

  return (
    <>
      {mobileOpen && (
        <div
          className="cortyze-sidebar-backdrop"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}
      <aside
        className={`cortyze-sidebar${mobileOpen ? " is-mobile-open" : ""}`}
        style={{
          width: showContent ? EXPANDED_WIDTH : COLLAPSED_WIDTH,
          flexShrink: 0,
          borderRight: "0.5px solid rgba(0,0,0,0.08)",
          padding: showContent ? "12px 16px" : "12px 8px",
          display: "flex",
          flexDirection: "column",
          gap: 10,
          overflowY: "auto",
          overflowX: "hidden",
          transition: "width 220ms ease, padding 220ms ease",
        }}
      >
        <button
          onClick={() => {
            if (mobileOpen) {
              onMobileClose?.();
            } else {
              onExpandedChange(!expanded);
            }
          }}
          aria-label={
            mobileOpen
              ? "Close sidebar"
              : expanded
                ? "Collapse sidebar"
                : "Expand sidebar"
          }
          title={mobileOpen ? "Close" : expanded ? "Collapse" : "Expand"}
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            border: "none",
            background: "transparent",
            cursor: "pointer",
            display: "grid",
            placeItems: "center",
            color: "var(--ink-2)",
            alignSelf: showContent ? "flex-start" : "center",
            flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(0,0,0,0.05)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
          }}
        >
          {mobileOpen ? (
            <svg
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            >
              <path d="M4 4l10 10" />
              <path d="M14 4L4 14" />
            </svg>
          ) : (
            <svg
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            >
              <path d="M3 5h12" />
              <path d="M3 9h12" />
              <path d="M3 13h12" />
            </svg>
          )}
        </button>

        {showContent && (
        <>
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
                    if (!isActive)
                      e.currentTarget.style.background = "rgba(0,0,0,0.03)";
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive)
                      e.currentTarget.style.background = "transparent";
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
        </>
      )}
      </aside>
    </>
  );
}

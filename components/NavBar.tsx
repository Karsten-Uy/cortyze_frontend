"use client";

type Tab = "bench" | "results" | "compare";

export function NavBar({
  active,
  onSelect,
  onOpenSidebar,
}: {
  active: Tab;
  onSelect: (tab: Tab) => void;
  onOpenSidebar?: () => void;
}) {
  return (
    <nav
      style={{
        padding: "12px 20px",
        borderBottom: "0.5px solid rgba(0,0,0,0.08)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexShrink: 0,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {onOpenSidebar && (
          <button
            onClick={onOpenSidebar}
            aria-label="Open past runs"
            className="cortyze-mobile-only"
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              border: "none",
              background: "transparent",
              color: "var(--ink-2)",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
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
          </button>
        )}
        <div
          className="serif"
          style={{
            fontSize: 16,
            fontWeight: 500,
            color: "var(--ink)",
            letterSpacing: "-0.01em",
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <img
            src="/cortyze-logo.png"
            alt=""
            width={22}
            height={22}
            style={{ display: "block" }}
          />
          cortyze
        </div>
      </div>

      <div style={{ display: "flex", gap: 4 }}>
        <NavTab active={active === "bench"} onClick={() => onSelect("bench")}>
          Lab bench
        </NavTab>
        <NavTab active={active === "results"} onClick={() => onSelect("results")}>
          Results
        </NavTab>
        <NavTab active={active === "compare"} onClick={() => onSelect("compare")}>
          Compare
        </NavTab>
      </div>

      {/* Spacer keeps the tab pill centered now that the profile chip
          on the right has been removed (anonymous-by-default mode). */}
      <div style={{ width: 32 }} aria-hidden="true" />
    </nav>
  );
}

function NavTab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        fontSize: 12,
        padding: "6px 14px",
        borderRadius: 20,
        border: "none",
        background: active ? "var(--ink)" : "transparent",
        color: active ? "var(--cream)" : "#888",
        transition: "all 150ms",
        fontWeight: active ? 500 : 400,
      }}
    >
      {children}
    </button>
  );
}

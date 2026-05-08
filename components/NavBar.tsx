"use client";

import { useEffect, useRef, useState } from "react";

import type { Profile } from "@/lib/api";

type Tab = "bench" | "results";

export function NavBar({
  active,
  onSelect,
  profile,
  onSignOut,
}: {
  active: Tab;
  onSelect: (tab: Tab) => void;
  profile?: Profile | null;
  onSignOut?: () => void | Promise<void>;
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
      <div
        className="serif"
        style={{
          fontSize: 16,
          fontWeight: 500,
          color: "var(--ink)",
          letterSpacing: "-0.01em",
        }}
      >
        cortyze
      </div>

      <div style={{ display: "flex", gap: 4 }}>
        <NavTab active={active === "bench"} onClick={() => onSelect("bench")}>
          Lab bench
        </NavTab>
        <NavTab active={active === "results"} onClick={() => onSelect("results")}>
          Results
        </NavTab>
      </div>

      <ProfileMenu profile={profile} onSignOut={onSignOut} />
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

// Initials for the avatar circle. Prefers display_name (first chars of
// the first two words), falls back to the email username, then to "?".
function initialsFor(profile: Profile | null | undefined): string {
  const source =
    profile?.display_name?.trim() ||
    profile?.email?.split("@", 1)[0] ||
    "";
  if (!source) return "?";
  const words = source.split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

function ProfileMenu({
  profile,
  onSignOut,
}: {
  profile: Profile | null | undefined;
  onSignOut?: () => void | Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Close on outside click — same pattern the BreakdownCard tooltip uses.
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node | null;
      if (target && containerRef.current && !containerRef.current.contains(target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const initials = initialsFor(profile);
  const name = profile?.display_name?.trim() || null;
  const email = profile?.email || null;

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Account menu"
        style={{
          width: 28,
          height: 28,
          borderRadius: "50%",
          border: "0.5px solid var(--rule)",
          background: open ? "var(--coral-tint)" : "transparent",
          color: open ? "var(--coral)" : "var(--ink-2)",
          display: "grid",
          placeItems: "center",
          fontSize: 11,
          fontWeight: 500,
          letterSpacing: "0.3px",
          cursor: "pointer",
          transition: "background 120ms, color 120ms",
        }}
      >
        {initials}
      </button>

      {open && (
        <div
          className="fade-up"
          style={{
            position: "absolute",
            top: 36,
            right: 0,
            zIndex: 20,
            minWidth: 220,
            background: "#FAFAF7",
            border: "0.5px solid rgba(0,0,0,0.1)",
            borderRadius: 10,
            padding: "6px",
            boxShadow: "0 4px 14px rgba(0,0,0,0.06)",
          }}
        >
          <div
            style={{
              padding: "8px 10px 10px",
              borderBottom: "0.5px solid var(--rule)",
              marginBottom: 4,
            }}
          >
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
              {name ?? "Signed in"}
            </div>
            {email && (
              <div
                style={{
                  fontSize: 11,
                  color: "var(--ink-3)",
                  marginTop: 2,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {email}
              </div>
            )}
            {!profile && (
              <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 2 }}>
                Anonymous session
              </div>
            )}
          </div>

          {onSignOut && (
            <button
              onClick={() => {
                setOpen(false);
                void onSignOut();
              }}
              style={{
                width: "100%",
                textAlign: "left",
                background: "transparent",
                border: "none",
                padding: "8px 10px",
                borderRadius: 6,
                fontSize: 12,
                color: "var(--ink-2)",
                cursor: "pointer",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "rgba(0,0,0,0.03)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              Sign out
            </button>
          )}
        </div>
      )}
    </div>
  );
}

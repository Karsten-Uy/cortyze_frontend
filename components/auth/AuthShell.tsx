// Shared chrome for /login, /signup, /reset-password. Centers a single
// card on the cream background with the Cortyze wordmark above. Keeps the
// auth screens visually consistent with the main app aesthetic.

import type { CSSProperties, ReactNode } from "react";

export const authInput: CSSProperties = {
  width: "100%",
  background: "#ffffff",
  border: "0.5px solid rgba(0,0,0,0.1)",
  borderRadius: 10,
  padding: "12px 14px",
  fontSize: 13,
  color: "var(--ink)",
  outline: "none",
  fontFamily: "inherit",
};

export const authButton: CSSProperties = {
  width: "100%",
  background: "var(--coral)",
  color: "#fff",
  border: "none",
  borderRadius: 12,
  padding: 14,
  fontSize: 14,
  fontWeight: 500,
  marginTop: 4,
  transition: "background 150ms",
};

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 16px",
        background: "var(--cream)",
      }}
    >
      <div style={{ width: "100%", maxWidth: 420 }}>
        <div
          className="serif"
          style={{
            fontSize: 18,
            fontWeight: 500,
            color: "var(--ink)",
            letterSpacing: "-0.01em",
            textAlign: "center",
            marginBottom: 18,
          }}
        >
          cortyze
        </div>

        <div
          style={{
            background: "rgba(255,255,255,0.7)",
            border: "0.5px solid var(--rule)",
            borderRadius: 14,
            padding: 28,
          }}
        >
          <h1
            className="serif"
            style={{
              margin: 0,
              fontSize: 24,
              fontWeight: 500,
              color: "var(--ink)",
              letterSpacing: "-0.01em",
            }}
          >
            {title}
          </h1>
          <p
            style={{
              marginTop: 6,
              marginBottom: 22,
              fontSize: 13,
              color: "var(--ink-3)",
            }}
          >
            {subtitle}
          </p>

          {children}
        </div>

        {footer && (
          <div
            style={{
              marginTop: 16,
              fontSize: 12,
              color: "var(--ink-3)",
              textAlign: "center",
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <label
      style={{
        display: "block",
        fontSize: 12,
        fontWeight: 500,
        color: "var(--ink)",
        marginBottom: 6,
      }}
    >
      {children}
    </label>
  );
}

export function FormError({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        background: "var(--red-tint)",
        border: "0.5px solid rgba(163,45,45,0.2)",
        color: "var(--red)",
        borderRadius: 8,
        padding: "8px 12px",
        fontSize: 12,
      }}
    >
      {children}
    </div>
  );
}

export function FormNotice({
  tone = "coral",
  children,
}: {
  tone?: "coral" | "green";
  children: ReactNode;
}) {
  const palette =
    tone === "green"
      ? { bg: "var(--green-tint)", border: "rgba(15,110,86,0.2)", fg: "var(--green)" }
      : { bg: "var(--coral-tint)", border: "rgba(212,97,62,0.2)", fg: "var(--coral)" };
  return (
    <div
      style={{
        background: palette.bg,
        border: "0.5px solid " + palette.border,
        color: palette.fg,
        borderRadius: 8,
        padding: "8px 12px",
        fontSize: 12,
      }}
    >
      {children}
    </div>
  );
}

import type { Tone } from "@/lib/cortyze-data";

export function Badge({
  tone = "coral",
  children,
  className,
}: {
  tone?: Tone;
  children: React.ReactNode;
  className?: string;
}) {
  const palette =
    tone === "green"
      ? { bg: "var(--green-tint)", fg: "var(--green)" }
      : { bg: "var(--coral-tint)", fg: "var(--coral)" };

  return (
    <span
      className={className}
      style={{
        display: "inline-block",
        fontSize: 9,
        fontWeight: 500,
        letterSpacing: "0.3px",
        textTransform: "uppercase",
        padding: "3px 10px",
        borderRadius: 20,
        background: palette.bg,
        color: palette.fg,
      }}
    >
      {children}
    </span>
  );
}

import type { CSSProperties, ReactNode } from "react";

type IconProps = {
  size?: number;
  strokeWidth?: number;
  style?: CSSProperties;
};

function Icon({
  size = 14,
  strokeWidth = 1,
  style,
  children,
}: IconProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="square"
      strokeLinejoin="miter"
      style={{ flexShrink: 0, ...style }}
    >
      {children}
    </svg>
  );
}

export const I = {
  Plus: (p: IconProps) => (
    <Icon {...p}>
      <path d="M8 3v10M3 8h10" />
    </Icon>
  ),
  Search: (p: IconProps) => (
    <Icon {...p}>
      <circle cx="7" cy="7" r="4" />
      <path d="M10 10l3 3" />
    </Icon>
  ),
  Chevron: (p: IconProps) => (
    <Icon {...p}>
      <path d="M6 4l4 4-4 4" />
    </Icon>
  ),
  ChevronD: (p: IconProps) => (
    <Icon {...p}>
      <path d="M4 6l4 4 4-4" />
    </Icon>
  ),
  Collapse: (p: IconProps) => (
    <Icon {...p}>
      <path d="M3 3v10M13 3v10M9 6l-3 2 3 2" />
    </Icon>
  ),
  Expand: (p: IconProps) => (
    <Icon {...p}>
      <path d="M3 3v10M13 3v10M6 6l3 2-3 2" />
    </Icon>
  ),
  Image: (p: IconProps) => (
    <Icon {...p}>
      <rect x="2.5" y="3" width="11" height="10" />
      <path d="M2.5 10l3-3 3 3 2-2 2.5 2.5" />
      <circle cx="10.5" cy="6" r="0.7" fill="currentColor" stroke="none" />
    </Icon>
  ),
  Video: (p: IconProps) => (
    <Icon {...p}>
      <rect x="2.5" y="4" width="8" height="8" />
      <path d="M10.5 7l3-2v6l-3-2z" />
    </Icon>
  ),
  Audio: (p: IconProps) => (
    <Icon {...p}>
      <path d="M3 6v4M5.5 4v8M8 5v6M10.5 3v10M13 6v4" />
    </Icon>
  ),
  Wave: (p: IconProps) => (
    <Icon {...p}>
      <path d="M2 8q1-3 2 0t2 0 2 0 2 0 2 0 2 0" />
    </Icon>
  ),
  Upload: (p: IconProps) => (
    <Icon {...p}>
      <path d="M8 11V3M5 6l3-3 3 3M3 13h10" />
    </Icon>
  ),
  Play: (p: IconProps) => (
    <Icon {...p}>
      <path d="M5 3l8 5-8 5z" fill="currentColor" />
    </Icon>
  ),
  Pause: (p: IconProps) => (
    <Icon {...p}>
      <path d="M5 3v10M11 3v10" />
    </Icon>
  ),
  Compare: (p: IconProps) => (
    <Icon {...p}>
      <rect x="2.5" y="3" width="5" height="10" />
      <rect x="8.5" y="3" width="5" height="10" />
    </Icon>
  ),
  Brain: (p: IconProps) => (
    <Icon {...p}>
      <circle cx="8" cy="8" r="5" />
      <path d="M8 3v10M5 4.5q2 3 0 7M11 4.5q-2 3 0 7" />
    </Icon>
  ),
  Beaker: (p: IconProps) => (
    <Icon {...p}>
      <path d="M6 2h4M6.5 2v4l-3 6a1 1 0 0 0 1 1.5h7a1 1 0 0 0 1-1.5l-3-6V2" />
    </Icon>
  ),
  Settings: (p: IconProps) => (
    <Icon {...p}>
      <circle cx="8" cy="8" r="2" />
      <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3 3l1.5 1.5M11.5 11.5L13 13M3 13l1.5-1.5M11.5 4.5L13 3" />
    </Icon>
  ),
  Close: (p: IconProps) => (
    <Icon {...p}>
      <path d="M3 3l10 10M13 3L3 13" />
    </Icon>
  ),
  Arrow: (p: IconProps) => (
    <Icon {...p}>
      <path d="M3 8h10M9 4l4 4-4 4" />
    </Icon>
  ),
  Filter: (p: IconProps) => (
    <Icon {...p}>
      <path d="M2 3h12l-4.5 5v5l-3-1.5V8z" />
    </Icon>
  ),
};

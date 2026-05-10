// Tiny shared formatters used across the Results screen + clip-player
// components. Lives here so the same `m:ss` formatting and YouTube ID
// parsing can be imported by both the example-ad mini player and the
// hero video on the Results page without one importing the other.

export function formatMSS(s: number): string {
  const total = Math.max(0, Math.floor(s));
  const m = Math.floor(total / 60);
  const sec = total % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

const YT_PATTERNS = [
  /youtu\.be\/([A-Za-z0-9_-]{6,})/,
  /[?&]v=([A-Za-z0-9_-]{6,})/,
  /youtube\.com\/embed\/([A-Za-z0-9_-]{6,})/,
  /youtube-nocookie\.com\/embed\/([A-Za-z0-9_-]{6,})/,
  /youtube\.com\/shorts\/([A-Za-z0-9_-]{6,})/,
];

export function extractYouTubeId(url: string): string | null {
  for (const re of YT_PATTERNS) {
    const m = url.match(re);
    if (m) return m[1];
  }
  return null;
}

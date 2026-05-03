// PET-scan color spectrum used by the brain map clusters and score chips.
// Maps a 0..100 score → a violet-to-ochre hex/rgb string.

const PET_STOPS: Array<{ v: number; c: string }> = [
  { v: 0, c: "#2E2A52" },
  { v: 0.25, c: "#5B3B7A" },
  { v: 0.5, c: "#9C4A6E" },
  { v: 0.7, c: "#C76A4A" },
  { v: 0.85, c: "#D89A3F" },
  { v: 1, c: "#E8C66B" },
];

function mixHex(a: string, b: string, t: number): string {
  const pa = [parseInt(a.slice(1, 3), 16), parseInt(a.slice(3, 5), 16), parseInt(a.slice(5, 7), 16)];
  const pb = [parseInt(b.slice(1, 3), 16), parseInt(b.slice(3, 5), 16), parseInt(b.slice(5, 7), 16)];
  const m = pa.map((v, i) => Math.round(v + (pb[i] - v) * t));
  return `rgb(${m[0]},${m[1]},${m[2]})`;
}

export function petColor(score: number): string {
  const t = Math.max(0, Math.min(1, score / 100));
  for (let i = 0; i < PET_STOPS.length - 1; i++) {
    const a = PET_STOPS[i];
    const b = PET_STOPS[i + 1];
    if (t >= a.v && t <= b.v) {
      const u = (t - a.v) / (b.v - a.v);
      return mixHex(a.c, b.c, u);
    }
  }
  return PET_STOPS[PET_STOPS.length - 1].c;
}

export function computeOverall(regions: { score: number; weight: number }[]): number {
  const total = regions.reduce((s, r) => s + r.score * r.weight, 0);
  const w = regions.reduce((s, r) => s + r.weight, 0);
  return total / w;
}

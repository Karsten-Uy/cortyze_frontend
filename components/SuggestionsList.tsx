"use client";

import { useEffect, useState } from "react";

import {
  REGION_LABELS,
  formatTimestamp,
  getExample,
  type ExampleAd,
  type Suggestion,
} from "@/lib/api";

const PRIORITY_LABEL: Record<Suggestion["priority"], string> = {
  critical: "Critical",
  important: "Important",
  minor: "Minor",
};

const PRIORITY_BG: Record<Suggestion["priority"], string> = {
  critical: "bg-poor-soft text-poor",
  important: "bg-warn-soft text-warn",
  minor: "bg-accent-soft text-accent",
};

const PRIORITY_DOT: Record<Suggestion["priority"], string> = {
  critical: "bg-poor",
  important: "bg-warn",
  minor: "bg-accent",
};

const PRIORITY_ORDER: Record<Suggestion["priority"], number> = {
  critical: 0,
  important: 1,
  minor: 2,
};

export function SuggestionsList({
  suggestions,
  highlightRegion,
}: {
  suggestions: Suggestion[];
  highlightRegion?: string | null;
}) {
  if (suggestions.length === 0) {
    return (
      <div className="card p-6 text-center text-sm text-foreground-muted">
        No suggestions for this run — every region scored above threshold.
      </div>
    );
  }

  const sorted = [...suggestions].sort((a, b) => {
    const p = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
    if (p !== 0) return p;
    return a.region.localeCompare(b.region);
  });

  // If a region is highlighted (e.g. the user clicked a metric card),
  // float that region's suggestions to the top.
  const ordered = highlightRegion
    ? [
        ...sorted.filter((s) => s.region === highlightRegion),
        ...sorted.filter((s) => s.region !== highlightRegion),
      ]
    : sorted;

  return (
    <div className="space-y-3">
      {ordered.map((s, i) => (
        <SuggestionItem
          key={`${s.region}-${i}`}
          suggestion={s}
          highlighted={highlightRegion === s.region}
        />
      ))}
    </div>
  );
}

function SuggestionItem({
  suggestion,
  highlighted,
}: {
  suggestion: Suggestion;
  highlighted?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [example, setExample] = useState<ExampleAd | null>(null);
  const [exampleLoading, setExampleLoading] = useState(false);
  const [exampleError, setExampleError] = useState<string | null>(null);

  // Lazy-fetch the first reference example only on expand. Avoids burning
  // bandwidth on the ~20 suggestions a typical report carries.
  useEffect(() => {
    if (!open) return;
    if (example || exampleLoading) return;
    const firstName = suggestion.examples?.[0];
    if (!firstName) return;
    setExampleLoading(true);
    getExample(firstName)
      .then((ad) => {
        setExample(ad);
        setExampleLoading(false);
      })
      .catch((e) => {
        setExampleError(e instanceof Error ? e.message : String(e));
        setExampleLoading(false);
      });
  }, [open, suggestion.examples, example, exampleLoading]);

  const regionLabel =
    REGION_LABELS[suggestion.region as keyof typeof REGION_LABELS] ??
    suggestion.region;

  const tsLabel =
    suggestion.timestamp_start_s != null && suggestion.timestamp_end_s != null
      ? `${formatTimestamp(suggestion.timestamp_start_s)}–${formatTimestamp(suggestion.timestamp_end_s)}`
      : suggestion.image_index_start != null
        ? suggestion.image_index_start === suggestion.image_index_end
          ? `Image ${suggestion.image_index_start}`
          : `Images ${suggestion.image_index_start}–${suggestion.image_index_end}`
        : null;

  return (
    <div
      className={`card overflow-hidden transition ${
        highlighted ? "ring-2 ring-accent ring-offset-2 ring-offset-background" : ""
      }`}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start gap-3 px-5 py-4 text-left hover:bg-surface-muted"
        aria-expanded={open}
      >
        <span
          className={`mt-1.5 inline-block h-2 w-2 shrink-0 rounded-full ${PRIORITY_DOT[suggestion.priority]}`}
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${PRIORITY_BG[suggestion.priority]}`}
            >
              {PRIORITY_LABEL[suggestion.priority]}
            </span>
            <span className="text-xs text-foreground-subtle">
              {regionLabel}
            </span>
            {tsLabel && (
              <span className="rounded-md bg-surface-muted px-2 py-0.5 font-mono text-[11px] text-foreground-muted">
                {tsLabel}
              </span>
            )}
          </div>
          <h3 className="mt-1.5 text-sm font-medium text-foreground">
            {suggestion.title}
          </h3>
        </div>
        <svg
          width="18"
          height="18"
          viewBox="0 0 18 18"
          className={`mt-1 shrink-0 text-foreground-subtle transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        >
          <path
            d="M4 7l5 5 5-5"
            stroke="currentColor"
            strokeWidth={1.5}
            fill="none"
            strokeLinecap="round"
          />
        </svg>
      </button>

      {open && (
        <div className="space-y-4 border-t border-border bg-surface-muted/40 px-5 py-4">
          <div>
            <h4 className="text-xs font-medium uppercase tracking-wider text-foreground-subtle">
              The fix
            </h4>
            <p className="mt-1 text-sm leading-relaxed text-foreground">
              {suggestion.fix}
            </p>
          </div>
          {suggestion.why && (
            <div>
              <h4 className="text-xs font-medium uppercase tracking-wider text-foreground-subtle">
                Why it matters
              </h4>
              <p className="mt-1 text-sm leading-relaxed text-foreground-muted italic">
                {suggestion.why}
              </p>
            </div>
          )}

          {/* Reference example */}
          <div>
            <h4 className="text-xs font-medium uppercase tracking-wider text-foreground-subtle">
              Reference that did this well
            </h4>
            {exampleLoading && (
              <p className="mt-2 text-sm text-foreground-subtle">
                Loading example…
              </p>
            )}
            {exampleError && (
              <p className="mt-2 text-sm text-poor">
                Failed to load example: {exampleError}
              </p>
            )}
            {!exampleLoading && !exampleError && !example && (
              <p className="mt-2 text-sm text-foreground-subtle italic">
                No reference example registered for this region yet.
              </p>
            )}
            {example && (
              <div className="mt-2 flex gap-3 rounded-lg border border-border bg-surface p-3">
                {example.thumbnail_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={example.thumbnail_url}
                    alt={example.display_name}
                    className="h-24 w-24 shrink-0 rounded-md object-cover"
                  />
                ) : (
                  <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-md bg-surface-muted text-[10px] text-foreground-subtle">
                    No preview
                  </div>
                )}
                <div className="flex flex-1 flex-col">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">
                      {example.display_name}
                    </span>
                    {example.content_type && (
                      <span className="rounded-full bg-surface-muted px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider text-foreground-subtle">
                        {example.content_type}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-foreground-muted">
                    {example.description}
                  </p>
                  {example.caption && (
                    <p className="mt-1 text-xs italic text-foreground-subtle line-clamp-2">
                      &ldquo;{example.caption}&rdquo;
                    </p>
                  )}
                  <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-foreground-subtle">
                    {Object.entries(example.region_scores)
                      .filter(([r]) => r === suggestion.region)
                      .map(([r, score]) => (
                        <span key={r}>
                          {regionLabel}:{" "}
                          <span className="font-semibold text-foreground">
                            {Math.round(score)}
                          </span>
                        </span>
                      ))}
                    <span>·</span>
                    <a
                      href={example.source_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-accent hover:text-accent-hover"
                    >
                      View source
                    </a>
                    {example.license && (
                      <>
                        <span>·</span>
                        <span>{example.license}</span>
                      </>
                    )}
                  </div>
                  {example.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {example.tags.slice(0, 5).map((t) => (
                        <span
                          key={t}
                          className="rounded-full bg-accent-soft px-1.5 py-0.5 text-[10px] text-accent"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

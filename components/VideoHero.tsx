"use client";

// Hero video on the Results screen. Wires `seekTo(seconds)` into the
// shared `VideoPlayerProvider` so sparklines and suggestion-pill
// clicks elsewhere on the page can move the playhead without
// prop-drilling.
//
// Two source kinds:
//   - YouTube URLs (the demo samples): use the YouTube IFrame Player
//     API so we can call `player.seekTo(s, true)` after load. The
//     simple `?start=` query-param trick (used by ExampleAdPlayer)
//     can't seek the iframe after the initial load, which is exactly
//     the interaction we want here.
//   - Anything else (R2 MP4): a native <video> element; setting
//     `currentTime` is a no-op SDK call.

import { useEffect, useRef } from "react";

import { extractYouTubeId } from "@/lib/format";
import { useRegisterVideoSeek } from "@/lib/videoPlayer";

// ---------------------------------------------------------------------------
// YouTube IFrame API loader (singleton)
// ---------------------------------------------------------------------------

type YTPlayer = {
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  playVideo(): void;
  destroy(): void;
};

type YTConstructor = new (
  el: HTMLElement | string,
  opts: {
    videoId: string;
    width?: string | number;
    height?: string | number;
    playerVars?: Record<string, string | number>;
    events?: { onReady?: (e: { target: YTPlayer }) => void };
  },
) => YTPlayer;

type YTNamespace = { Player: YTConstructor };

declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let ytLoadPromise: Promise<YTNamespace> | null = null;

function loadYouTubeAPI(): Promise<YTNamespace> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("YouTube API requires a browser"));
  }
  if (ytLoadPromise) return ytLoadPromise;

  ytLoadPromise = new Promise<YTNamespace>((resolve) => {
    if (window.YT?.Player) {
      resolve(window.YT);
      return;
    }
    // The IFrame API calls a fixed global callback when ready.
    // Preserve any existing handler so we don't stomp on a co-tenant.
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (typeof prev === "function") prev();
      if (window.YT) resolve(window.YT);
    };
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    tag.async = true;
    document.head.appendChild(tag);
  });

  return ytLoadPromise;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function VideoHero({ mediaUrl }: { mediaUrl: string | null }) {
  if (!mediaUrl) return null;
  const ytId = extractYouTubeId(mediaUrl);
  return (
    <div
      style={{
        width: "100%",
        maxWidth: 720,
        margin: "0 auto 16px",
      }}
    >
      <div
        style={{
          width: "100%",
          aspectRatio: "16 / 9",
          background: "#000",
          borderRadius: 12,
          overflow: "hidden",
          border: "0.5px solid rgba(0,0,0,0.08)",
        }}
      >
        {ytId ? (
          <YouTubeHero videoId={ytId} />
        ) : (
          <NativeHero src={mediaUrl} />
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Source-specific subcomponents
// ---------------------------------------------------------------------------

function YouTubeHero({ videoId }: { videoId: string }) {
  // The IFrame API replaces this <div> with its own iframe on Player
  // construction. Holding the ref lets us pass the actual element
  // (rather than an id string).
  const containerRef = useRef<HTMLDivElement>(null);
  const registerSeek = useRegisterVideoSeek();

  useEffect(() => {
    let player: YTPlayer | null = null;
    let cancelled = false;

    loadYouTubeAPI()
      .then((YT) => {
        if (cancelled || !containerRef.current) return;
        player = new YT.Player(containerRef.current, {
          videoId,
          width: "100%",
          height: "100%",
          playerVars: {
            playsinline: 1,
            modestbranding: 1,
            rel: 0,
            iv_load_policy: 3,
            // Don't autoplay — the hero is for context, not for grabbing
            // attention. The user clicks a sparkline/pill to start playback.
            autoplay: 0,
          },
          events: {
            onReady: ({ target }) => {
              registerSeek((seconds) => {
                try {
                  target.seekTo(Math.max(0, seconds), true);
                  target.playVideo();
                } catch {
                  /* iframe gone or not ready */
                }
              });
            },
          },
        });
      })
      .catch(() => {
        /* network blocked / API failed — hero just stays inert */
      });

    return () => {
      cancelled = true;
      try {
        player?.destroy();
      } catch {
        /* already torn down */
      }
    };
  }, [videoId, registerSeek]);

  return (
    <div
      style={{ width: "100%", height: "100%" }}
      // The API mutates this child into an <iframe>; the wrapper keeps
      // the 16:9 box stable across that swap.
    >
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
    </div>
  );
}

function NativeHero({ src }: { src: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const registerSeek = useRegisterVideoSeek();

  useEffect(() => {
    registerSeek((seconds) => {
      const v = videoRef.current;
      if (!v) return;
      try {
        v.currentTime = Math.max(0, seconds);
        v.play().catch(() => {});
      } catch {
        /* element gone */
      }
    });
  }, [registerSeek]);

  return (
    <video
      ref={videoRef}
      src={src}
      controls
      playsInline
      preload="metadata"
      style={{
        width: "100%",
        height: "100%",
        objectFit: "cover",
        display: "block",
      }}
    />
  );
}

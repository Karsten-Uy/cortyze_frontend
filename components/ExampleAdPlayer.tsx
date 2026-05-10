"use client";

// Embeds the suggested example ad and seeks it to the section where
// the suggestion's region peaks. Handles two source-URL shapes:
//
//   - YouTube watch / short URLs → <iframe> via youtube.com/embed/<id>
//     with `?start=&end=&autoplay=1&mute=1&playsinline=1`. YouTube's
//     embed doesn't support clean segment looping without the IFrame
//     JS SDK, so playback runs forward from the peak (no loop).
//
//   - Anything else (R2 MP4, etc.) → native <video> looping the
//     [start, end] segment.

import { extractYouTubeId, formatMSS } from "@/lib/format";

type Props = {
  src: string;
  startS: number;
  endS: number;
};

// Caps the embed at 280×158 on wide screens but lets it shrink to fill
// the available width when the suggestion card wraps onto a narrow
// column. The 16:9 aspect-ratio is preserved via CSS.
const PLAYER_MAX_WIDTH = 280;

export function ExampleAdPlayer({ src, startS, endS }: Props) {
  const ytId = extractYouTubeId(src);
  const caption = (
    <div
      className="mono"
      style={{
        fontSize: 10,
        color: "var(--ink-3)",
        letterSpacing: "0.04em",
      }}
    >
      {formatMSS(startS)}–{formatMSS(endS)} · peak moment
    </div>
  );

  if (ytId) {
    const start = Math.floor(startS);
    const end = Math.ceil(endS);
    const params = new URLSearchParams({
      start: String(start),
      end: String(end),
      autoplay: "1",
      mute: "1",
      playsinline: "1",
      controls: "0",         // hides the bottom bar (the "LAY'S | Last…" title chip lives there)
      modestbranding: "1",   // smaller YouTube watermark
      rel: "0",              // no related-videos grid at end
      iv_load_policy: "3",   // hide annotations
      disablekb: "1",        // no keyboard chrome
      fs: "0",               // no fullscreen button
      cc_load_policy: "0",   // no auto-CC chip
      showinfo: "0",         // legacy hide-title (still respected on some clients)
    });
    // youtube-nocookie removes the cookie banner overlay and tends to
    // render with less chrome than the youtube.com host.
    const embed = `https://www.youtube-nocookie.com/embed/${ytId}?${params.toString()}`;
    return (
      <div
        className="cortyze-example-card-player"
        style={{
          width: "100%",
          maxWidth: PLAYER_MAX_WIDTH,
          flex: "1 1 200px",
          display: "flex",
          flexDirection: "column",
          gap: 4,
        }}
      >
        <iframe
          src={embed}
          allow="autoplay; encrypted-media; picture-in-picture"
          // YouTube embed doesn't expose a "fullscreen requested" event
          // without the IFrame API, but the user can still go fullscreen
          // via the player's own UI.
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          style={{
            border: "none",
            borderRadius: 10,
            background: "#000",
            display: "block",
            width: "100%",
            aspectRatio: "16 / 9",
          }}
          title="Suggested ad — peak moment"
        />
        {caption}
      </div>
    );
  }

  // Native <video> fallback: loops within [startS, endS] muted-autoplay.
  return (
    <div
      className="cortyze-example-card-player"
      style={{
        width: "100%",
        maxWidth: PLAYER_MAX_WIDTH,
        flex: "1 1 200px",
        display: "flex",
        flexDirection: "column",
        gap: 4,
      }}
    >
      <video
        src={src}
        muted
        autoPlay
        playsInline
        preload="metadata"
        loop={false}
        onLoadedMetadata={(e) => {
          e.currentTarget.currentTime = startS;
          e.currentTarget.play().catch(() => {});
        }}
        onTimeUpdate={(e) => {
          const v = e.currentTarget;
          if (v.currentTime >= endS - 0.05 || v.currentTime < startS - 0.05) {
            v.currentTime = startS;
            v.play().catch(() => {});
          }
        }}
        style={{
          width: "100%",
          aspectRatio: "16 / 9",
          background: "#000",
          borderRadius: 10,
          objectFit: "cover",
          display: "block",
        }}
      />
      {caption}
    </div>
  );
}

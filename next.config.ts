import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // FFmpeg.wasm requires SharedArrayBuffer, which only works under "cross-origin
  // isolation". These two headers opt the page into that isolation.
  // See lib/compress.ts. If/when you remove client-side video compression,
  // you can drop these headers — they restrict cross-origin embeds, third-party
  // images without CORP, etc.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
        ],
      },
    ];
  },
};

export default nextConfig;

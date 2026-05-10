import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root so Next doesn't auto-detect the empty
  // package-lock.json one directory up (which lives at
  // C:\Users\karst\Documents\Cortyze\) and emit a "multiple lockfiles"
  // warning on every build. Turbopack honors this for FS scope.
  turbopack: {
    root: __dirname,
  },
  // Reverse-proxy PostHog through this app's own origin so ad blockers
  // don't intercept the requests. Order matters — the /static rewrite
  // must come BEFORE the catch-all so assets aren't routed to the
  // events host. Also requires skipTrailingSlashRedirect, otherwise
  // POSTs to /ingest/e/ get 308'd to /ingest/e and lose their body.
  async rewrites() {
    return [
      {
        source: "/ingest/static/:path*",
        destination: "https://us-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/ingest/:path*",
        destination: "https://us.i.posthog.com/:path*",
      },
      {
        source: "/ingest/decide",
        destination: "https://us.i.posthog.com/decide",
      },
    ];
  },
  skipTrailingSlashRedirect: true,
};

export default nextConfig;

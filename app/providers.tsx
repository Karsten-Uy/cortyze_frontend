"use client";

import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";
import { useEffect } from "react";

export function CSPostHogProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (!key) return;
    posthog.init(key, {
      // Reverse-proxied through Next.js rewrites (see next.config.ts)
      // so ad blockers don't intercept these requests as third-party.
      api_host:
        process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "/ingest",
      // ui_host is what PostHog uses to construct deep-links from the
      // dashboard back to events; keep it pointing at the real host.
      ui_host:
        process.env.NEXT_PUBLIC_POSTHOG_UI_HOST ?? "https://us.posthog.com",
      // App Router doesn't fire script-level pageview on client navs,
      // so we capture them manually in PostHogPageView.
      capture_pageview: false,
      person_profiles: "identified_only",
      // Cookieless: no cookies, no localStorage, no cookie banner
      // needed. Anonymous users get a fresh distinct_id every page
      // load. Identified users (after Supabase auth) still merge
      // server-side via email.
      persistence: "memory",
      disable_session_recording: true,
    });
  }, []);

  return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
}

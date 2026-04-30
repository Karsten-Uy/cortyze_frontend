// Browser-side Supabase client. Used by client components for sign-in,
// sign-up, sign-out, and reading the current session. The browser client
// stores tokens in cookies (managed by @supabase/ssr) so the proxy can
// also read the session on the server.
//
// Env vars (set in .env.local; see .env.local.example):
//   NEXT_PUBLIC_SUPABASE_URL       e.g. https://abcdef.supabase.co
//   NEXT_PUBLIC_SUPABASE_ANON_KEY  the public anon key from Project Settings → API

import { createBrowserClient } from "@supabase/ssr";

export function createSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. " +
        "Copy .env.local.example to .env.local and fill in your Supabase project values.",
    );
  }
  return createBrowserClient(url, anonKey);
}

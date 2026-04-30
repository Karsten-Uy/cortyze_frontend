// Server-side Supabase client. Used by:
//   - proxy.ts to read session for route gating
//   - server components (app/.../page.tsx) that need the user
//   - route handlers (none yet, but reserved)
//
// The server client uses Next.js's `cookies()` helper for token storage.
// Async because `cookies()` is async in Next 16.

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY",
    );
  }
  const cookieStore = await cookies();
  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // setAll fails in pure Server Components (read-only context).
          // The proxy + Server Actions paths handle setting cookies; SCs
          // just read them, so swallowing this is safe.
        }
      },
    },
  });
}

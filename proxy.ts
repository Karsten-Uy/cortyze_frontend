// Next.js 16 renamed middleware → proxy. Same role: runs before each
// request, decides whether to redirect.
//
// Auth gate: any route that isn't explicitly public (login, signup,
// reset-password, /_next/*, /favicon.ico, etc.) requires a Supabase
// session cookie. Anonymous users get bounced to /login.

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

const PUBLIC_ROUTES = new Set([
  "/login",
  "/signup",
  "/reset-password",
  "/auth/callback",
]);

function isPublic(pathname: string): boolean {
  if (PUBLIC_ROUTES.has(pathname)) return true;
  // Static assets and Next internals.
  if (pathname.startsWith("/_next")) return true;
  if (pathname.startsWith("/api")) return true; // none yet, but reserved
  if (pathname === "/favicon.ico") return true;
  if (pathname.match(/\.(png|jpg|jpeg|svg|webp|ico|css|js|map)$/)) return true;
  return false;
}

export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (isPublic(pathname)) {
    return NextResponse.next();
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Without Supabase configured, fall through. The login page itself will
  // surface the missing env-var error so users see a real message instead
  // of a white screen redirect loop.
  if (!url || !anonKey) {
    return NextResponse.next();
  }

  // Build a response we can attach refreshed cookies to. Per @supabase/ssr
  // docs, the cookies need to be set both on the request (for downstream
  // server components) and the response (for the browser).
  const response = NextResponse.next();

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return req.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value));
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  // getUser() validates the JWT against Supabase (server-side), so this is
  // not just a cookie-presence check — expired / forged sessions get
  // rejected here and the user is bounced to /login.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  // Match everything except static assets. The matcher is conservative so
  // session cookie refresh runs on every navigation.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};

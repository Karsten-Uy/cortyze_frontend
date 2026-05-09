// Next.js 16 renamed middleware → proxy.
//
// Auth gate is intentionally OFF — Cortyze runs as an anonymous-by-default
// product right now (login screen removed, `/me` no longer called). The
// proxy is kept as a no-op so:
//   * If we ever want to re-introduce auth, the file is already wired up.
//   * The frontend code can keep `proxy.ts` referenced by Next without
//     blowing up at deploy time.

import { NextRequest, NextResponse } from "next/server";

export default function proxy(_req: NextRequest) {
  return NextResponse.next();
}

export const config = {
  // Match nothing meaningful — every navigation flows through unchanged.
  // We keep an empty matcher rather than removing the file because some
  // Next.js 16 setups expect `proxy.ts` to exist at the project root.
  matcher: ["/((?!.*).*)"],
};

import { NextRequest, NextResponse } from "next/server";

/**
 * Optional access gate.
 *
 * Set ACCESS_CODE in Vercel env vars to lock the app behind a shared code.
 * If ACCESS_CODE is unset, the gate is OFF and the app is fully public.
 */

const COOKIE_NAME = "sld-unlock";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

const PUBLIC_PREFIXES = [
  "/unlock",
  "/api/unlock",
  "/_next",
  "/favicon",
  "/robots.txt",
];

function isPublic(pathname: string) {
  return PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/") || pathname === p);
}

export function middleware(req: NextRequest) {
  const accessCode = process.env.ACCESS_CODE;

  // Gate is only active if ACCESS_CODE is configured
  if (!accessCode) return NextResponse.next();

  const { pathname } = req.nextUrl;

  if (isPublic(pathname)) return NextResponse.next();

  // Compare cookie value to env var
  const cookie = req.cookies.get(COOKIE_NAME);
  if (cookie?.value && cookie.value === accessCode) {
    return NextResponse.next();
  }

  // Redirect to unlock page, preserving where they wanted to go
  const url = req.nextUrl.clone();
  url.pathname = "/unlock";
  if (pathname !== "/") url.searchParams.set("redirect", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    // Run on every path except Next.js internals and static assets
    "/((?!_next/static|_next/image|favicon.ico|robots.txt).*)",
  ],
};

export { COOKIE_NAME, COOKIE_MAX_AGE };

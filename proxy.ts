import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "./lib/auth-config";

const protectedPrefixes = ["/private", "/settings", "/project/private"];

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const requiresAuth =
    pathname === "/shared" ||
    protectedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

  if (!requiresAuth) {
    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (sessionCookie) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", `${pathname}${search}`);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/private/:path*", "/shared", "/settings/:path*", "/project/private/:path*"],
};

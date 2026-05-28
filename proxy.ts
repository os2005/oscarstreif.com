import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "./lib/auth-config";

const protectedPrefixes = ["/private", "/settings", "/project/private"];
const treffpunktHosts = new Set(["treffpunkt.oscarstreif.com", "treffpunkt.oskarstreif.com"]);
const treffpunktNoStore = "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0";

function isTreffpunktHost(host: string) {
  return treffpunktHosts.has(host.split(":")[0].toLowerCase());
}

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (pathname === "/" && isTreffpunktHost(request.headers.get("host") ?? "")) {
    const rewriteUrl = request.nextUrl.clone();
    rewriteUrl.pathname = "/treffpunkt";
    const response = NextResponse.rewrite(rewriteUrl);
    response.headers.set("Cache-Control", treffpunktNoStore);
    return response;
  }

  if (pathname === "/CV") {
    return NextResponse.redirect(new URL("/cv", request.url));
  }

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
  matcher: ["/", "/private/:path*", "/shared", "/settings/:path*", "/project/private/:path*", "/CV"],
};

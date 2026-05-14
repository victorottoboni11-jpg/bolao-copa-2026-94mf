import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = ["/", "/favicon.ico", "/robots.txt"];
const AUTH_COOKIE_NAME = "bolao-auth";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PATHS.includes(pathname)) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/_next") || pathname.startsWith("/static") || pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  const hasAuthCookie = req.cookies.get(AUTH_COOKIE_NAME)?.value === "true";

  if (!hasAuthCookie) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/";
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

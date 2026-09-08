import { NextResponse, type NextRequest } from "next/server";
import {
  DEFAULT_SITE_REGION,
  parseSiteRegion,
  SITE_REGION_COOKIE,
  SITE_REGION_PARAM,
} from "@/lib/region";

const SESSION_COOKIE = "better-auth.session_token";

const REGION_AWARE_PATHS = [
  "/",
  "/players",
  "/games",
  "/teams",
  "/records",
  "/stats",
  "/schedules",
  "/seasons",
  "/awards",
  "/vector-graph",
];

function redirectToLogin(request: NextRequest, returnTo: string) {
  const login = new URL("/login", request.url);
  login.searchParams.set("next", returnTo);
  return NextResponse.redirect(login);
}

function isRegionAware(pathname: string): boolean {
  return REGION_AWARE_PATHS.some(
    (path) => pathname === path || (path !== "/" && pathname.startsWith(`${path}/`)),
  );
}

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const hasSession = request.cookies.has(SESSION_COOKIE);

  if (pathname.startsWith("/portal") && !hasSession) {
    return redirectToLogin(request, pathname);
  }

  if ((pathname.startsWith("/profile") || pathname.startsWith("/articles/create")) && !hasSession) {
    return redirectToLogin(request, pathname);
  }

  if (
    request.method === "GET" &&
    isRegionAware(pathname) &&
    !searchParams.has(SITE_REGION_PARAM)
  ) {
    const cookieRegion = parseSiteRegion(request.cookies.get(SITE_REGION_COOKIE)?.value);
    if (cookieRegion !== DEFAULT_SITE_REGION) {
      const target = new URL(request.nextUrl);
      target.searchParams.set(SITE_REGION_PARAM, cookieRegion);
      return NextResponse.redirect(target);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/portal/:path*",
    "/profile/:path*",
    "/articles/create/:path*",
    "/",
    "/players/:path*",
    "/games/:path*",
    "/teams/:path*",
    "/records/:path*",
    "/stats/:path*",
    "/schedules/:path*",
    "/seasons/:path*",
    "/awards/:path*",
    "/vector-graph/:path*",
  ],
};

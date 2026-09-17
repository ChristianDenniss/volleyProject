import { NextResponse, type NextRequest } from "next/server";
import { hasSessionCookie, isClientRouterNavigation } from "@/lib/session-cookie";

function redirectToLogin(request: NextRequest, returnTo: string) {
  const login = new URL("/login", request.url);
  login.searchParams.set("next", returnTo);
  return NextResponse.redirect(login);
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = hasSessionCookie(request.headers.get("cookie"));
  if (hasSession || isClientRouterNavigation(request.headers)) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/portal")) {
    return redirectToLogin(request, pathname);
  }

  if (pathname.startsWith("/profile") || pathname.startsWith("/articles/create")) {
    return redirectToLogin(request, pathname);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/portal/:path*", "/profile/:path*", "/articles/create/:path*"],
};

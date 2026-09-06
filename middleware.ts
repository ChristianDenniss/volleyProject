import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "better-auth.session_token";

function redirectToLogin(request: NextRequest, returnTo: string) {
  const login = new URL("/login", request.url);
  login.searchParams.set("next", returnTo);
  return NextResponse.redirect(login);
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = request.cookies.has(SESSION_COOKIE);

  if (pathname.startsWith("/portal") && !hasSession) {
    return redirectToLogin(request, pathname);
  }

  if ((pathname.startsWith("/profile") || pathname.startsWith("/articles/create")) && !hasSession) {
    return redirectToLogin(request, pathname);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/portal/:path*", "/profile/:path*", "/articles/create/:path*"],
};

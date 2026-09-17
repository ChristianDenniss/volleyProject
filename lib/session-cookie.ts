const SESSION_COOKIE_NAMES = [
  "better-auth.session_token",
  "__Secure-better-auth.session_token",
  "__Host-better-auth.session_token",
  "better-auth-session_token",
  "__Secure-better-auth-session_token",
] as const;

/** True when the request carries a better-auth session cookie, including the HTTPS `__Secure-` name. */
export function hasSessionCookie(cookieHeader: string | null | undefined): boolean {
  if (!cookieHeader) return false;

  for (const part of cookieHeader.split(";")) {
    const name = part.trim().split("=")[0]?.trim();
    if (!name) continue;
    for (const sessionName of SESSION_COOKIE_NAMES) {
      if (name === sessionName || name.startsWith(`${sessionName}.`)) return true;
    }
  }

  return false;
}

/** Vinext client navigations send Next-Url; an HTTP 307 from middleware freezes that router. */
export function isClientRouterNavigation(headers: Headers): boolean {
  return headers.has("Next-Url");
}

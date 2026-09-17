import { describe, expect, it } from "vitest";
import { hasSessionCookie, isClientRouterNavigation } from "@/lib/session-cookie";

describe("hasSessionCookie", () => {
  it("treats a missing header as signed out", () => {
    expect(hasSessionCookie(undefined)).toBe(false);
    expect(hasSessionCookie(null)).toBe(false);
    expect(hasSessionCookie("")).toBe(false);
  });

  it("finds the local HTTP cookie name", () => {
    expect(hasSessionCookie("better-auth.session_token=abc.sig")).toBe(true);
  });

  it("finds the HTTPS __Secure- cookie that middleware used to miss", () => {
    expect(hasSessionCookie("__Secure-better-auth.session_token=abc.sig")).toBe(true);
    expect(hasSessionCookie("theme=dark; __Secure-better-auth.session_token=abc.sig")).toBe(true);
  });

  it("finds chunked session cookies", () => {
    expect(hasSessionCookie("better-auth.session_token.0=chunk")).toBe(true);
    expect(hasSessionCookie("__Secure-better-auth.session_token.0=chunk")).toBe(true);
  });

  it("does not treat an unrelated cookie as a session", () => {
    expect(hasSessionCookie("sidebar_state=true; theme=dark")).toBe(false);
    expect(hasSessionCookie("not-better-auth.session_token=nope")).toBe(false);
  });
});

describe("isClientRouterNavigation", () => {
  it("detects vinext client navigations from Next-Url", () => {
    expect(isClientRouterNavigation(new Headers({ "Next-Url": "/portal" }))).toBe(true);
    expect(isClientRouterNavigation(new Headers())).toBe(false);
  });
});

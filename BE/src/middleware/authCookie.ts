import type { Response } from "express";
import crypto from "crypto";

export const AUTH_COOKIE_NAME = "auth_token";
export const CSRF_COOKIE_NAME = "csrf_token";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

function isProduction(): boolean {
    return process.env.NODE_ENV === "production";
}

export function setAuthCookies(res: Response, token: string): string {
    const csrfToken = crypto.randomBytes(32).toString("hex");

    res.cookie(AUTH_COOKIE_NAME, token, {
        httpOnly: true,
        secure: isProduction(),
        sameSite: isProduction() ? "strict" : "lax",
        maxAge: SEVEN_DAYS_MS,
        path: "/",
    });

    res.cookie(CSRF_COOKIE_NAME, csrfToken, {
        httpOnly: false,
        secure: isProduction(),
        sameSite: isProduction() ? "strict" : "lax",
        maxAge: SEVEN_DAYS_MS,
        path: "/",
    });

    return csrfToken;
}

export function clearAuthCookies(res: Response): void {
    res.clearCookie(AUTH_COOKIE_NAME, { path: "/" });
    res.clearCookie(CSRF_COOKIE_NAME, { path: "/" });
}

export function extractAuthToken(req: { header: (name: string) => string | undefined; cookies?: Record<string, string> }): string | undefined {
    const bearer = req.header("Authorization")?.replace("Bearer ", "");
    if (bearer) {
        return bearer;
    }

    return req.cookies?.[AUTH_COOKIE_NAME];
}

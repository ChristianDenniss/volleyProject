import { Request, Response, NextFunction } from "express";
import { CSRF_COOKIE_NAME, AUTH_COOKIE_NAME } from "./authCookie.js";
import { UnauthorizedError } from "../errors/UnauthorizedError.js";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
const CSRF_EXEMPT_PATHS = new Set([
    "/api/users/login",
    "/api/users/register",
    "/api/users/logout",
]);

function getAllowedOrigins(): string[] {
    if (process.env.CORS_ORIGINS) {
        return process.env.CORS_ORIGINS.split(",").map((origin) => origin.trim()).filter(Boolean);
    }

    if (process.env.NODE_ENV === "production") {
        return ["https://volleyball4-2.com"];
    }

    return [
        "https://volleyball4-2.com",
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:5174",
    ];
}

export function csrfProtection(req: Request, res: Response, next: NextFunction): void {
    if (SAFE_METHODS.has(req.method) || CSRF_EXEMPT_PATHS.has(req.path)) {
        next();
        return;
    }

    const bearerToken = req.header("Authorization")?.replace("Bearer ", "");
    const cookieToken = req.cookies?.[AUTH_COOKIE_NAME];

    if (bearerToken && !cookieToken) {
        next();
        return;
    }

    const origin = req.header("Origin");
    const allowedOrigins = getAllowedOrigins();

    if (origin && !allowedOrigins.includes(origin)) {
        next(new UnauthorizedError("Invalid request origin"));
        return;
    }

    const csrfCookie = req.cookies?.[CSRF_COOKIE_NAME];
    const csrfHeader = req.header("X-CSRF-Token");

    if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
        next(new UnauthorizedError("Invalid CSRF token"));
        return;
    }

    next();
}

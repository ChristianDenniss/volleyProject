// src/middleware/apiKeyAuth.ts
// — Verifies an API key for direct access
// — Must be mounted on specific routes; there is no global role bypass.

import { Request, Response, NextFunction } from "express";
import { UnauthorizedError } from "../errors/UnauthorizedError.js";

export const authenticateApiKey = (req: Request, res: Response, next: NextFunction): void => {
    const apiKey = req.header("Authorization")?.replace("Bearer ", "") ||
                   req.header("X-API-Key");

    if (!apiKey) {
        throw new UnauthorizedError("API key is required");
    }

    const validApiKey = process.env.API_SECRET_KEY;

    if (!validApiKey) {
        console.error("API_SECRET_KEY not configured in environment");
        throw new UnauthorizedError("API key authentication not configured");
    }

    if (apiKey !== validApiKey) {
        throw new UnauthorizedError("Invalid API key");
    }

    (req as any).isApiKeyAuth = true;

    next();
};

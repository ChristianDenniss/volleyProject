// src/middleware/apiKeyAuth.ts
// — Verifies an API key for direct access
// — Alternative to JWT authentication for server-to-server or direct API calls

import { Request, Response, NextFunction } from "express";
import { UnauthorizedError } from "../errors/UnauthorizedError.js";

export const authenticateApiKey = (req: Request, res: Response, next: NextFunction): void => {
    // Pull the API key from the Authorization header or X-API-Key header
    const apiKey = req.header("Authorization")?.replace("Bearer ", "") || 
                   req.header("X-API-Key");

    // Fail early if missing
    if (!apiKey) {
        throw new UnauthorizedError("API key is required");
    }

    // Check against environment variable
    const validApiKey = process.env.API_SECRET_KEY;
    
    if (!validApiKey) {
        console.error("API_SECRET_KEY not configured in environment");
        throw new UnauthorizedError("API key authentication not configured");
    }

    // Verify the API key
    if (apiKey !== validApiKey) {
        throw new UnauthorizedError("Invalid API key");
    }

    // Attach a special user object for API key access
    (req as any).user = {
        id: 0,
        role: "api",
        username: "api-user"
    };

    // Proceed to the next middleware / route
    next();
}; 
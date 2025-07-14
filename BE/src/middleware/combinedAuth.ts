// src/middleware/combinedAuth.ts
// — Combines JWT and API key authentication
// — Tries JWT first, then falls back to API key
// — Allows both web app users and direct API access

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { UnauthorizedError } from "../errors/UnauthorizedError.js";

export interface JwtPayload {
    id: number;
    role: string;          //  "user" | "admin" | "superadmin"
    username: string;
}

export const authenticateCombined = (req: Request, res: Response, next: NextFunction): void => {
    // Pull the token/key from the Authorization header
    const authHeader = req.header("Authorization");
    const apiKeyHeader = req.header("X-API-Key");

    if (!authHeader && !apiKeyHeader) {
        throw new UnauthorizedError("Authorization token or API key is required");
    }

    // Try API key first (simpler check)
    if (apiKeyHeader) {
        const validApiKey = process.env.API_SECRET_KEY;
        
        if (validApiKey && apiKeyHeader === validApiKey) {
            (req as any).user = {
                id: 0,
                role: "api",
                username: "api-user"
            };
            next();
            return;
        }
    }

    // Try JWT token
    if (authHeader) {
        const token = authHeader.replace("Bearer ", "");

        // Verify the token
        jwt.verify(token, process.env.JWT_SECRET || "", (err, decoded) => {
            //  Any error → unauth
            if (err) {
                throw new UnauthorizedError("Invalid or expired token");
            }

            //  decoded is *unknown*; validate it has the pieces we need
            if
            (
                decoded &&
                typeof decoded === "object" &&
                "id"   in decoded &&
                "role" in decoded
            )
            {
                //  Attach the user object for downstream middleware / controllers
                (req as any).user = decoded as JwtPayload;
            }
            else
            {
                //  Malformed payload
                throw new UnauthorizedError("Token payload missing required fields");
            }

            //  Proceed to the next middleware / route
            next();
        });
        return;
    }

    // If we get here, neither method worked
    throw new UnauthorizedError("Invalid authentication");
}; 
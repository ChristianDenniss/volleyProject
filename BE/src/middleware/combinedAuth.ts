// src/middleware/combinedAuth.ts
// — JWT authentication middleware
// — Verifies JWT tokens for web app users

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { UnauthorizedError } from "../errors/UnauthorizedError.js";

export interface JwtPayload {
    id: number;
    role: string;          //  "user" | "admin" | "superadmin"
    username: string;
}

export const authenticateCombined = (req: Request, res: Response, next: NextFunction): void => {
    // Pull the token from the Authorization header
    const authHeader = req.header("Authorization");

    if (!authHeader) {
        throw new UnauthorizedError("Authorization token is required");
    }

    const token = authHeader.replace("Bearer ", "");

    // Verify the token
    jwt.verify(token, process.env.JWT_SECRET || "", (err: any, decoded: any) => {
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
}; 
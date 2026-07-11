import jwt from "jsonwebtoken";
import { AppDataSource } from "../db/data-source.js";
import { UnauthorizedError } from "../errors/UnauthorizedError.js";
import { User } from "../modules/user/user.entity.js";

export const ALLOWED_JWT_ROLES = ["user", "admin", "superadmin"] as const;
export type AllowedJwtRole = (typeof ALLOWED_JWT_ROLES)[number];

export interface VerifiedJwtUser {
    id: number;
    username: string;
    role: AllowedJwtRole;
    tokenVersion: number;
}

export function getJwtSecret(): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new UnauthorizedError("JWT authentication is not configured");
    }
    return secret;
}

export async function validateJwtPayload(decoded: jwt.JwtPayload): Promise<VerifiedJwtUser> {
    const { id, role, tokenVersion, username } = decoded;

    if (typeof id !== "number" || typeof role !== "string" || typeof username !== "string") {
        throw new UnauthorizedError("Token payload missing required fields");
    }

    if (!ALLOWED_JWT_ROLES.includes(role as AllowedJwtRole)) {
        throw new UnauthorizedError("Invalid token role");
    }

    if (typeof tokenVersion !== "number") {
        throw new UnauthorizedError("Token has been invalidated. Please log in again.");
    }

    const user = await AppDataSource.getRepository(User).findOne({
        where: { id },
        select: ["id", "username", "role", "tokenVersion"],
    });

    if (!user) {
        throw new UnauthorizedError("Invalid or expired token");
    }

    if (user.tokenVersion !== tokenVersion) {
        throw new UnauthorizedError("Token has been invalidated. Please log in again.");
    }

    if (!ALLOWED_JWT_ROLES.includes(user.role as AllowedJwtRole)) {
        throw new UnauthorizedError("Invalid token role");
    }

    return {
        id: user.id,
        username: user.username,
        role: user.role as AllowedJwtRole,
        tokenVersion: user.tokenVersion,
    };
}

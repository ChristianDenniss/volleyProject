//  src/middleware/authorizeRoles.ts
//  ────────────────────────────────────────────────────────────────
//  Gate a request by role.
//  • Requires `authenticateToken` to have already attached `req.user`
//  • Sends 401 if no user, 403 if role not allowed
//  • Returns *void* so Express types are satisfied
//  ────────────────────────────────────────────────────────────────

import { Request, Response, NextFunction } from "express";
import { ALLOWED_JWT_ROLES } from "./authValidation.js";

export function authorizeRoles(...allowed: string[])
{
    return (req: Request, res: Response, next: NextFunction): void =>
    {
        const user = (req as any).user as { role?: string } | undefined;

        if (!user)
        {
            res.status(401).json({ message: "Unauthorized" });
            return;
        }

        if (!ALLOWED_JWT_ROLES.includes(user.role as typeof ALLOWED_JWT_ROLES[number]))
        {
            res.status(403).json({ message: "Forbidden" });
            return;
        }

        if (!allowed.includes(user.role!))
        {
            res.status(403).json({ message: "Forbidden" });
            return;
        }

        next();
    };
}

/**
 * Middleware that requires admin privileges for non-GET requests
 * • GET requests are allowed for all authenticated users
 * • POST, PUT, PATCH, DELETE require admin or superadmin role
 */
export function requireAdminForWrite(req: Request, res: Response, next: NextFunction): void
{
    const user = (req as any).user as { role?: string } | undefined;

    if (!user)
    {
        res.status(401).json({ message: "Unauthorized" });
        return;
    }

    if (!ALLOWED_JWT_ROLES.includes(user.role as typeof ALLOWED_JWT_ROLES[number]))
    {
        res.status(403).json({ message: "Forbidden" });
        return;
    }

    if (req.method === "GET")
    {
        next();
        return;
    }

    if (user.role !== "admin" && user.role !== "superadmin")
    {
        res.status(403).json({
            message: "Forbidden",
            error: "Admin privileges required for this operation"
        });
        return;
    }

    next();
}

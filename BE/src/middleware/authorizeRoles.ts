//  src/middleware/authorizeRoles.ts
//  ────────────────────────────────────────────────────────────────
//  Gate a request by role.
//  • Requires `authenticateToken` to have already attached `req.user`
//  • Sends 401 if no user, 403 if role not allowed
//  • Returns *void* so Express types are satisfied
//  ────────────────────────────────────────────────────────────────

import { Request, Response, NextFunction } from "express";

export function authorizeRoles(...allowed: string[])
{
    //  Inner Express handler (must return void)
    return (req: Request, res: Response, next: NextFunction): void =>
    {
        //  Extract the user object placed by authenticateToken
        const user = (req as any).user as { role?: string } | undefined;

        //  Reject when no authenticated user
        if (!user)
        {
            res.status(401).json({ message: "Unauthorized" });
            return;                 //  explicit void return
        }

        //  API key users have full access (role: "api")
        if (user.role === "api")
        {
            next();
            return;
        }

        //  Reject when role is not in the allowed list
        if (!allowed.includes(user.role!))
        {
            res.status(403).json({ message: "Forbidden" });
            return;                 //  explicit void return
        }

        //  Role is allowed – proceed
        next();
    };
}

/**
 * Middleware that requires admin privileges for non-GET requests
 * • GET requests are allowed for all authenticated users
 * • POST, PUT, PATCH, DELETE require admin or superadmin role
 * • API key users have full access
 */
export function requireAdminForWrite(req: Request, res: Response, next: NextFunction): void
{
    //  Extract the user object placed by authenticateToken
    const user = (req as any).user as { role?: string } | undefined;

    //  Reject when no authenticated user
    if (!user)
    {
        res.status(401).json({ message: "Unauthorized" });
        return;
    }

    //  API key users have full access (role: "api")
    if (user.role === "api")
    {
        next();
        return;
    }

    //  GET requests are allowed for all authenticated users
    if (req.method === "GET")
    {
        next();
        return;
    }

    //  For non-GET requests, require admin or superadmin
    if (user.role !== "admin" && user.role !== "superadmin")
    {
        res.status(403).json({ 
            message: "Forbidden", 
            error: "Admin privileges required for this operation" 
        });
        return;
    }

    //  Admin role is allowed – proceed
    next();
}

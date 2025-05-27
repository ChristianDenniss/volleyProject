//  src/middleware/authorizeRoles.ts
//  ────────────────────────────────────────────────────────────────
//  Gate a request by role.
//  • Requires `authenticateToken` to have already attached `req.user`
//  • Sends 401 if no user, 403 if role not allowed
//  • Returns *void* so Express types are satisfied
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

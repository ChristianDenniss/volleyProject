import { Request, Response, NextFunction } from "express";

export function requireRegistrationEnabled(req: Request, res: Response, next: NextFunction): void {
    if (process.env.ALLOW_REGISTRATION === "false") {
        res.status(403).json({ error: "Registration is disabled" });
        return;
    }
    next();
}

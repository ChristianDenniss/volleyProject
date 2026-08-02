import { Request, Response, NextFunction } from "express";

export function requireRegistrationEnabled(req: Request, res: Response, next: NextFunction): void {
    const isProduction = process.env.NODE_ENV === "production";

    if (isProduction && process.env.ALLOW_REGISTRATION !== "true") {
        res.status(403).json({ error: "Registration is disabled" });
        return;
    }

    if (!isProduction && process.env.ALLOW_REGISTRATION === "false") {
        res.status(403).json({ error: "Registration is disabled" });
        return;
    }

    next();
}

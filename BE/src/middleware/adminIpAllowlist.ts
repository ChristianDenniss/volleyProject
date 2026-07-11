import { Request, Response, NextFunction } from "express";

export function adminIpAllowlist(req: Request, res: Response, next: NextFunction): void {
    const allowlist = process.env.ADMIN_IP_ALLOWLIST
        ?.split(",")
        .map((entry) => entry.trim())
        .filter(Boolean);

    if (!allowlist?.length) {
        next();
        return;
    }

    const clientIp = req.ip ?? req.socket.remoteAddress ?? "";

    if (!allowlist.includes(clientIp)) {
        res.status(403).json({ error: "Forbidden" });
        return;
    }

    next();
}

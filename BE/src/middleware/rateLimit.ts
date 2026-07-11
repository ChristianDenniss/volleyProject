import rateLimit from "express-rate-limit";

export const loginRateLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 5,
    message: { error: "Too many login attempts. Please try again later." },
    standardHeaders: true,
    legacyHeaders: false,
});

export const registerRateLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 3,
    message: { error: "Too many registration attempts. Please try again later." },
    standardHeaders: true,
    legacyHeaders: false,
});

export const adminRateLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 20,
    keyGenerator: (req) => {
        const user = (req as { user?: { id?: number } }).user;
        if (user?.id) {
            return `admin-user-${user.id}`;
        }
        return req.ip ?? "unknown";
    },
    message: { error: "Too many admin requests. Please try again later." },
    standardHeaders: true,
    legacyHeaders: false,
});

export const robloxRateLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    message: { error: "Too many Roblox avatar requests. Please try again later." },
    standardHeaders: true,
    legacyHeaders: false,
});

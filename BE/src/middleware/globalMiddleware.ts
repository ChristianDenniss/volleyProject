import { loggerMiddleware } from './logger.js';
import { Application } from 'express';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { authenticateToken } from "./authentication.js";
import { authorizeRoles } from "./authorizeRoles.js";
import { adminRateLimiter } from "./rateLimit.js";
import { csrfProtection } from "./csrfProtection.js";
import { adminIpAllowlist } from "./adminIpAllowlist.js";
import { getAllowedOrigins } from "../utils/allowedOrigins.js";


/**
 * Register all global middleware to the Express application
 */
export function globalMiddleware(app: Application): void
{
    app.use(helmet());

    const allowedOrigins = getAllowedOrigins();
    const corsOptions: cors.CorsOptions = {
        origin: allowedOrigins,
        credentials: true,
    };

    app.use(cors(corsOptions));
    app.options('*', cors(corsOptions));

    app.use(cookieParser());
    app.use(express.json({ limit: "1mb" }));
    app.use(csrfProtection);

    app.use(loggerMiddleware);

    app.use(
        "/api/admin",
        authenticateToken,
        adminIpAllowlist,
        adminRateLimiter,
        authorizeRoles("admin", "superadmin")
    );
}

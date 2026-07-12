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

const PRODUCTION_ORIGINS = ['https://volleyball4-2.com'];
const DEVELOPMENT_ORIGINS = [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:8080',
];

function getAllowedOrigins(): string[] {
    if (process.env.CORS_ORIGINS) {
        return process.env.CORS_ORIGINS.split(',').map((origin) => origin.trim()).filter(Boolean);
    }

    if (process.env.NODE_ENV === 'production') {
        return PRODUCTION_ORIGINS;
    }

    return [...PRODUCTION_ORIGINS, ...DEVELOPMENT_ORIGINS];
}

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

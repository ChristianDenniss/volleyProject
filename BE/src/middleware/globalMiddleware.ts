import { loggerMiddleware } from './logger.ts';
import { errorHandler } from './errorHandling.ts';
import { Application } from 'express';
import express from 'express';
import cors from 'cors';
import { authenticateToken } from "./authentication.ts";
import { authorizeRoles } from "./authorizeRoles.ts"


/**
 * Register all global middleware to the Express application
 */
export function globalMiddleware(app: Application): void
{
    // Code to only allow requests from a specific origin
    // app.use(cors({
    //     origin: 'http://localhost:3000' 
    //   }));
    app.use(cors());
    app.use(express.json()); 
    app.use(loggerMiddleware);

    app.use(
        "/api/admin",
        authenticateToken,
        authorizeRoles("admin", "superadmin")
    );
}   

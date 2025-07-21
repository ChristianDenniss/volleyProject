import { loggerMiddleware } from './logger.js';
import { errorHandler } from './errorHandling.js';
import { Application } from 'express';
import express from 'express';
import cors from 'cors';
import { authenticateToken } from "./authentication.js";
import { authorizeRoles } from "./authorizeRoles.js"


/**
 * Register all global middleware to the Express application
 */
export function globalMiddleware(app: Application): void
{
    // Code to only allow requests from a specific origin
    // app.use(cors({
    //     origin: 'http://localhost:3000' 
    //   }));

    // CORS configuration
    app.use(cors({
        origin: ['https://volleyball4-2.com', 'http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174']
    }));
    
    // Handle preflight requests
    app.options('*', cors());
    
    // Parse JSON bodies
    app.use(express.json()); 

    // Log requests
    app.use(loggerMiddleware);

    app.use(
        "/api/admin",
        authenticateToken,
        authorizeRoles("admin", "superadmin")
    );
}   

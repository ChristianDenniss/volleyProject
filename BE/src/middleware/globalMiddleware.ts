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
    // CORS configuration for production and development
    const allowedOrigins = [
        'https://volleyball4-2.com',
        'https://www.volleyball4-2.com',
        'http://localhost:3000',
        'http://localhost:5173',
        'http://localhost:4173'
    ];

    app.use(cors({
        origin: function (origin, callback) {
            // Allow requests with no origin (like mobile apps or curl requests)
            if (!origin) return callback(null, true);
            
            if (allowedOrigins.indexOf(origin) !== -1) {
                callback(null, true);
            } else {
                console.log('CORS blocked origin:', origin);
                callback(new Error('Not allowed by CORS'));
            }
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    }));
    
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

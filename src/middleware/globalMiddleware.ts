import { loggerMiddleware } from './logger.js';
import { Application } from 'express';
import express from 'express';


/**
 * Register all global middleware to the Express application
 */
export function globalMiddleware(app: Application): void
{
    app.use(express.json()); 
    app.use(loggerMiddleware);
}   

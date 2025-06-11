import { Request, Response, NextFunction } from 'express';

// Log HTTP method and path
export function loggerMiddleware(req: Request, res: Response, next: NextFunction): void
{
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.path}`);
    
    if (Object.keys(req.query).length > 0) {
        console.log('Query params:', req.query);
    }
    
    if (Object.keys(req.body).length > 0) {
        console.log('Request body:', req.body);
    }
    
    next();
}

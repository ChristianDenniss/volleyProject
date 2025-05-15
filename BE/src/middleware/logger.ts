import { Request, Response, NextFunction } from 'express';

// Log HTTP method and path
export function loggerMiddleware(req: Request, res: Response, next: NextFunction): void
{
    console.log(`${req.method} ${req.path}`);

    console.log("Parsed body:", req.body);
    next();
}

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UnauthorizedError } from '../errors/UnauthorizedError.js';

export const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        throw new UnauthorizedError('Authorization token is required');
    }

    jwt.verify(token, process.env.JWT_SECRET || '', (err, decoded) => {
        if (err) {
            throw new UnauthorizedError('Invalid or expired token');
        }

        // Attach the user data to the request (e.g., user ID)
        if (decoded && typeof decoded === 'object' && 'id' in decoded) {
            (req as any).userId = decoded.id;  // You can add more user data if needed
        }

        next();
    });
};

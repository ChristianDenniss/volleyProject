import { NextFunction, Request, Response } from 'express';
import { ZodSchema, ZodError } from 'zod';

export const validate = (schema: ZodSchema<any>) =>
{
    return (req: Request, res: Response, next: NextFunction): void =>
    {
        try
        {
            console.log('Validation: Received request body:', req.body);
            // Always parse the full body — works for both object and array schemas
            req.body = schema.parse(req.body);
            console.log('Validation: Successfully validated request body');
            next();
        }
        catch (error)
        {
            if (error instanceof ZodError)
            {
                console.error('Validation: Zod validation error:', error.errors);
                res.status(400).json({
                    message: "Validation failed",
                    errors: error.errors,
                });
            }
            else
            {
                console.error('Validation: Unexpected error:', error);
                next(error);
            }
        }
    };
};

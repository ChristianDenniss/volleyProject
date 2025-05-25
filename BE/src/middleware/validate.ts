import { NextFunction, Request, Response } from 'express';
import { ZodSchema, ZodError } from 'zod';

export const validate = (schema: ZodSchema<any>) =>
{
    return (req: Request, res: Response, next: NextFunction): void =>
    {
        try
        {
            // Always parse the full body — works for both object and array schemas
            req.body = schema.parse(req.body);
            next();
        }
        catch (error)
        {
            if (error instanceof ZodError)
            {
                res.status(400).json({
                    message: "Validation failed",
                    errors: error.errors,
                });
            }
            else
            {
                next(error);
            }
        }
    };
};

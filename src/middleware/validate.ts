// Import types for Express request/response/next and Zod validation
import { NextFunction, Request, Response } from 'express';
import { ZodSchema, ZodError } from 'zod';

// Create a reusable middleware function that accepts a Zod schema
export const validate = (schema: ZodSchema<any>) =>
{
    // Return an Express middleware function
    return (req: Request, res: Response, next: NextFunction): void =>
    {
        try
        {
            // Check if the body is an array (batch case)
            if (Array.isArray(req.body))
            {
                // Validate each item in the array using the provided schema (e.g., for batch creation)
                req.body.forEach(item => schema.parse(item));
            }
            else
            {
                // If the body is not an array, validate the single object
                schema.parse(req.body);
            }

            // If validation passes, proceed to the next middleware or controller
            next();
        }
        catch (error)
        {
            // If the error is a Zod validation error
            if (error instanceof ZodError)
            {
                // Return a 400 response with error details
                res.status(400).json(
                {
                    message: "Validation failed",
                    errors: error.errors,
                });
            }

            // For all other errors, pass them to the error handler
            next(error);
        }
    };
};

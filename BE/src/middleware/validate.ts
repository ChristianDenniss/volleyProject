import { NextFunction, Request, Response } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { BadRequestError } from '../errors/BadRequestError.js';
import { sanitizeForLogging } from '../utils/sanitizeForLogging.js';

// Helper function to convert date strings to Date objects recursively
function convertDateStrings(obj: any): any {
    if (obj === null || obj === undefined) {
        return obj;
    }
    
    if (typeof obj === 'string') {
        // Check if it's an ISO date string
        const dateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
        if (dateRegex.test(obj)) {
            return new Date(obj);
        }
        return obj;
    }
    
    if (Array.isArray(obj)) {
        return obj.map(convertDateStrings);
    }
    
    if (typeof obj === 'object') {
        const converted: any = {};
        for (const [key, value] of Object.entries(obj)) {
            converted[key] = convertDateStrings(value);
        }
        return converted;
    }
    
    return obj;
}

export const validate = (schema: ZodSchema<any>) =>
{
    return (req: Request, res: Response, next: NextFunction): void =>
    {
        try
        {
            console.log('Validation: Received request body:', sanitizeForLogging(req.body));

            // Preprocess the body to convert date strings to Date objects
            const processedBody = convertDateStrings(req.body);
            console.log('Validation: Processed request body:', sanitizeForLogging(processedBody));
            
            // Validate the processed body
            req.body = schema.parse(processedBody);
            console.log('Validation: Successfully validated request body');
            next();
        }
        catch (error)
        {
            if (error instanceof ZodError)
            {
                console.error('Validation: Zod validation error:', error.errors);
                next(new BadRequestError("Validation failed", error.errors));
            }
            else
            {
                console.error('Validation: Unexpected error:', error);
                next(error);
            }
        }
    };
};

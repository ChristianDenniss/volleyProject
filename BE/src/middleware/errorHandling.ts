import { Request, Response, NextFunction } from 'express';
import { NotFoundError } from '../errors/NotFoundError.ts';
import { DuplicateError } from '../errors/DuplicateError.ts';
import { MissingFieldError } from '../errors/MissingFieldError.ts';
import { UnauthorizedError } from '../errors/UnauthorizedError.ts';
import { OutOfBoundsError } from '../errors/OutOfBoundsError.ts';
import { NegativeStatError } from '../errors/NegativeStatError.ts';
import { MultiplePlayersNotFoundError } from '../errors/MultiplePlayersNotFoundError.ts';
import { MultipleGamesNotFoundError } from '../errors/MultipleGamesNotFoundError.ts';
import { InvalidFormatError } from '../errors/InvalidFormatError.ts';
import { DateError } from '../errors/DateErrors.ts';
import { ConflictError } from '../errors/ConflictError.ts';
import { BadRequestError } from '../errors/BadRequestError.ts';

// Map error types to HTTP status codes
const errorCodeMapping: Record<string, number> = {
    DuplicateError: 400,
    MissingFieldError: 400,
    OutOfBoundsError: 400,
    NegativeStatError: 400,
    MultiplePlayersNotFoundError: 400,
    MultipleGamesNotFoundError: 400,
    InvalidFormatError: 400,
    DateError: 400,
    ConflictError: 400,
    BadRequestError: 400,
    UnauthorizedError: 401,
    NotFoundError: 404,
};

// Error handler middleware
export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction): void => {
    // Log error details
    console.error(`Error occurred during ${req.method} ${req.originalUrl}`);
    console.error("Request Body:", req.body);
    console.error("Request Params:", req.params);
    console.error("Request Query:", req.query);
    console.error(err);

    // Get the appropriate status code from the errorCodeMapping
    const statusCode = errorCodeMapping[err.constructor.name] || 500;

    // Include the stack trace only in development
    const response = {
        error: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    };

    // Send the error response
    res.status(statusCode).json(response);
};

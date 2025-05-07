import { Request, Response, NextFunction } from 'express';
import { NotFoundError } from '../errors/NotFoundError.js';
import { DuplicateError } from '../errors/DuplicateError.js';
import { MissingFieldError } from '../errors/MissingFieldError.js';
import { UnauthorizedError } from '../errors/UnauthorizedError.js';
import { OutOfBoundsError } from '../errors/OutOfBoundsError.js';
import { NegativeStatError } from '../errors/NegativeStatError.js';
import { MultiplePlayersNotFoundError } from '../errors/MultiplePlayersNotFoundError.js';
import { MultipleGamesNotFoundError } from '../errors/MultipleGamesNotFoundError.js';
import { InvalidFormatError } from '../errors/InvalidFormatError.js';
import { DateError } from '../errors/DateErrors.js';
import { ConflictError } from '../errors/ConflictError.js';
import { BadRequestError } from '../errors/BadRequestError.js';

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction): void => {
    console.error(err);

    // Handle 400 errors (Bad Request)
    const badRequestErrors = [
        DuplicateError,
        MissingFieldError,
        OutOfBoundsError,
        NegativeStatError,
        MultiplePlayersNotFoundError,
        MultipleGamesNotFoundError,
        InvalidFormatError,
        DateError,
        ConflictError,
        BadRequestError
    ];

    if (badRequestErrors.some(errorType => err instanceof errorType)) {
        res.status(400).json({ error: err.message });
        return; // This prevents further code execution after sending the response
    }

    // Handle 401 Unauthorized Error
    if (err instanceof UnauthorizedError) {
        res.status(401).json({ error: err.message });
        return;
    }

    // Handle 404 Not Found Error
    if (err instanceof NotFoundError) {
        res.status(404).json({ error: err.message });
        return;
    }

    // Catch-all for any unhandled errors
    res.status(500).json({ error: 'Internal Server Error' });
};

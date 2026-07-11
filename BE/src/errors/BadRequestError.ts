import { CustomError } from "./CustomError.js";

export class BadRequestError extends CustomError
{
    errors?: unknown;

    constructor(message = "Bad Request", errors?: unknown)
    {
        super(message, 400);
        this.name = 'BadRequestError';
        this.errors = errors;
    }
}

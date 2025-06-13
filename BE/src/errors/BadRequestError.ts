import { CustomError } from "./CustomError.ts";

export class BadRequestError extends CustomError
{
    constructor(message = "Bad Request")
    {
        super(message, 400);
        this.name = 'BadRequestError';
    }
}

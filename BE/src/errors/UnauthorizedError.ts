import { CustomError } from "./CustomError.js";

export class UnauthorizedError extends CustomError
{
    constructor(message: string)
    {
        super(message, 401 );
        this.name = 'UnauthorizedError';
    }
}

export class ServerError extends CustomError
{
    constructor(message: string)
    {
        super(message, 500);
        this.name = 'Server error';
    }
}

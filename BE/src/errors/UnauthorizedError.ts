import { CustomError } from "./CustomError.ts";

export class UnauthorizedError extends CustomError
{
    constructor(message: string)
    {
        super(message, 401 );
        this.name = 'UnauthorizedError';
    }
}

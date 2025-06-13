import { CustomError } from "./CustomError.ts";

export class NotFoundError extends CustomError 
{
    constructor(message: string)
    {
        super(message, 404);
        this.name = 'NotFoundError';
    }
}

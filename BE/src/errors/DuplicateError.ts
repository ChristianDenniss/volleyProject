import { CustomError } from "./CustomError.ts";

export class DuplicateError extends CustomError 
{
    constructor(message: string) 
    {
        super(message, 409);
        this.name = 'DuplicateError';
    }
}
import { CustomError } from "./CustomError.ts";

export class ConflictError extends CustomError 
{
    constructor(message: string) 
    {
        super(message, 409);
        this.name = 'ConflictError';
    }
}

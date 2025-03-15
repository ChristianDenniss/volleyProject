import { CustomError } from "./CustomError.js";

export class ConflictError extends CustomError 
{
    constructor(message: string) 
    {
        super(message, 409);
    }
}

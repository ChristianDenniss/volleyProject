import { CustomError } from "./CustomError";

export class ConflictError extends CustomError 
{
    constructor(message: string) 
    {
        super(message, 409);
    }
}

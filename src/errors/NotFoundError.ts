import { CustomError } from "./CustomError.js";

export class NotFoundError extends CustomError 
{
    constructor(message: string)
    {
        super(message, 404);
    }
}

import { CustomError } from "./CustomError.js";

export class BadRequestError extends CustomError
{
    constructor(message = "Bad Request")
    {
        super(message, 400);
    }
}

import { CustomError } from "./CustomError";

export class BadRequestError extends CustomError
{
    constructor(message = "Bad Request")
    {
        super(message, 400);
    }
}

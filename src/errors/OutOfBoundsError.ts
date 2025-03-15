import { CustomError } from "./CustomError.js";

export class OutOfBoundsError extends CustomError
{
    constructor(message: string)
    {
        super(message, 422 );
    }
}

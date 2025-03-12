import { CustomError } from "./CustomError";

export class OutOfBoundsError extends CustomError
{
    constructor(message: string)
    {
        super(message, 422 );
    }
}

import { CustomError } from "./CustomError.ts";

export class OutOfBoundsError extends CustomError
{
    constructor(message: string)
    {
        super(message, 422 );
        this.name = 'OutOfBoundsError';
    }
}

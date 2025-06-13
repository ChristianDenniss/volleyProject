import { CustomError } from "./CustomError.ts";


export class InvalidFormatError extends CustomError 
{
    constructor(message: string) 
    {
        super(message, 422 );
        this.name = 'InvalidFormatError';
    }
}


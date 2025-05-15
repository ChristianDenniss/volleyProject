import { CustomError } from "./CustomError.js";


export class InvalidFormatError extends CustomError 
{
    constructor(message: string) 
    {
        super(message, 422 );
        this.name = 'InvalidFormatError';
    }
}


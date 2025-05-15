import { CustomError } from "./CustomError.js";

export class MissingFieldError extends CustomError
{
    constructor(entityName: string)
    {
        super(`${entityName} is/are required and was not provided`, 400);
        this.name = 'MissingFieldError';
    }
}

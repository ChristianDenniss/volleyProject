import { CustomError } from "./CustomError.ts";

export class NegativeStatError extends CustomError
{
    constructor(statName: string)
    {
        super(`${statName} cannot be negative`, 400);
        this.name = 'NegativeStatError';
    }
}

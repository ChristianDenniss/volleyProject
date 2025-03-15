import { CustomError } from "./CustomError.js";

export class NegativeStatError extends CustomError
{
    constructor(statName: string)
    {
        super(`${statName} cannot be negative`, 400);
    }
}

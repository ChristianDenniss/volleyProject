import { CustomError } from "./CustomError.js";

export class MultipleGamesNotFoundError extends CustomError 
{
    constructor(gameIds: number[]) 
    {
        super(`Games with IDs [${gameIds.join(", ")}] not found`, 404);
    }
}


import { CustomError } from "./CustomError.ts";

export class MultipleGamesNotFoundError extends CustomError 
{
    constructor(gameIds: number[]) 
    {
        super(`Games with IDs [${gameIds.join(", ")}] not found`, 404);
        this.name = 'MultipleGamesNotFoundError';
    }
}


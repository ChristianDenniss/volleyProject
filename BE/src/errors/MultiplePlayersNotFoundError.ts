import { CustomError } from "./CustomError.ts";

export class MultiplePlayersNotFoundError extends CustomError 
{
    constructor(playerIds: number[]) 
    {
        super(`Players with IDs [${playerIds.join(", ")}] not found`, 404);
        this.name = 'MultiplePlayersNotFoundError';
    }
}
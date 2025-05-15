import { CustomError } from "./CustomError.js";

export class MultiplePlayersNotFoundError extends CustomError 
{
    constructor(playerIds: number[]) 
    {
        super(`Players with IDs [${playerIds.join(", ")}] not found`, 404);
        this.name = 'MultiplePlayersNotFoundError';
    }
}
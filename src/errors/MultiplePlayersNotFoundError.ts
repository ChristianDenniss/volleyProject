import { CustomError } from "./CustomError";

export class MultiplePlayersNotFoundError extends CustomError 
{
    constructor(playerIds: number[]) 
    {
        super(`Players with IDs [${playerIds.join(", ")}] not found`, 404);
    }
}
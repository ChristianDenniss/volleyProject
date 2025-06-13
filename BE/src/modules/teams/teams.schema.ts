import { z } from "zod";
import type { Players } from '../players/player.entity.ts';
import type { Games } from '../games/game.entity.ts';

export const createTeamSchema = z.object({
    name: z.string().min(1, { message: "Team Name is required" })
    .refine((name) => name.trim() !== "", { message: "Team Name cannot be empty" }),

    seasonId: z
    .number()
    .int({ message: "Season ID must be an integer" })
    .positive({ message: "Season ID must be a positive integer" })
    //zod would catch this without our refine but we are making sure to add a specific message to the error if no season id is provided
    .refine((id) => id !== undefined, { message: "Season ID is required" }),

    players: z.array(z.number().int().positive()).optional(),

    placement: z.string()
    .default("Didnt make playoffs")
    .refine(s => s.trim() !== "", { message: "Placement cannot be empty" }),

    games: z.array(z.number().int().positive()).optional(),
});

//we are using a partial extend to make the fields we want to update optional
//we are also making sure the given team id is valid
//this is not adding any new fields, it is just updating existing fields
export const updateTeamSchema = createTeamSchema.partial().extend(
{
    id: z.number().int().positive(),
});

    



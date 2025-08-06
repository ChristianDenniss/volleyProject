import { z } from "zod";
import type { Players } from '../players/player.entity.js';
import type { Games } from '../games/game.entity.js';

export const createTeamSchema = z.object({
    name: z.string().min(1, { message: "Team Name is required" })
    .refine((name) => name.trim() !== "", { message: "Team Name cannot be empty" }),

    seasonNumber: z
    .number()
    .int({ message: "Season Number must be an integer" })
    .positive({ message: "Season Number must be a positive integer" })
    //zod would catch this without our refine but we are making sure to add a specific message to the error if no season number is provided
    .refine((number) => number !== undefined, { message: "Season Number is required" }),

    players: z.array(z.number().int().positive()).optional(),

    placement: z.string()
    .default("Didnt make playoffs")
    .refine(s => s.trim() !== "", { message: "Placement cannot be empty" }),

    games: z.array(z.number().int().positive()).optional(),

    logoUrl: z.string().optional().nullable(), // Optional logo URL for team (relaxed validation)
});

//we are using a partial extend to make the fields we want to update optional
//we are also making sure the given team id is valid
//this is not adding any new fields, it is just updating existing fields
export const updateTeamSchema = createTeamSchema.partial();

export interface CreateTeamDto {
    name: string;
    seasonNumber: number; // Changed from seasonId to seasonNumber
    placement?: string;
    playerIds?: number[];
    gameIds?: number[];
    logoUrl?: string | null; // Optional logo URL for team
}

export interface UpdateTeamDto {
    name?: string;
    seasonNumber?: number; // Changed from seasonId to seasonNumber
    placement?: string;
    playerIds?: number[];
    gameIds?: number[];
    logoUrl?: string | null; // Optional logo URL for team
}

export type CreateMultipleTeamsDto = CreateTeamDto[];

    



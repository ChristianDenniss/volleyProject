import { z } from "zod";

// Base schema used for single player creation
const basePlayerSchema = z.object({
    name: z.string().min(1, { message: "Player Name is required" }),
    position: z.enum(
        ["N/A", "Setter", "Spiker", "Libero", "Defensive Specialist", "Pinch Server"],
        { message: "Invalid position, please match the enum values" }
    ),
    teamId: z.number().int().positive().nullable().optional(),
    teamName: z.string().min(1).optional()
});

export const createPlayerSchema = basePlayerSchema.refine(data => data.teamId || data.teamName, {
    message: "Either teamId or teamName is required",
    path: ["teamId"]
});

// Batch variant using teamNames: string[]
export const createMultiplePlayersByNameSchema = z.array(
    z.object({
        name: z.string().min(1, { message: "Player Name is required" }),
        position: z.enum(
            ["N/A", "Setter", "Spiker", "Libero", "Defensive Specialist", "Pinch Server"],
            { message: "Invalid position, please match the enum values" }
        ),
        teamNames: z.array(
            z.string().min(1, { message: "Team name must be a non-empty string" })
        ).min(1, { message: "At least one team name is required" })
    })
);

// Inferred DTOs
export type CreatePlayerDto = z.infer<typeof createPlayerSchema>;
export type CreateMultiplePlayersByNameDto = z.infer<typeof createMultiplePlayersByNameSchema>;

// Update schema (patch-like with required ID)
export const updatePlayerSchema = z.object({
    name: z.string().min(1, { message: "Player Name is required" }).optional(),
    position: z.enum(
        ["N/A", "Setter", "Spiker", "Libero", "Defensive Specialist", "Pinch Server"],
        { message: "Invalid position, please match the enum values" }
    ).optional(),
    teamIds: z.array(z.number().int().positive()).optional()
});

export type UpdatePlayerDto = z.infer<typeof updatePlayerSchema>;

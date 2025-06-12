import { z } from "zod";

// Base schema used for single award creation
const baseAwardSchema = z.object({
    description: z.string().min(1, { message: "Description is required" }),
    type: z.enum(
        ["MVP", "Best Spiker", "Best Server", "Best Blocker", "Best Libero", "Best Setter", "MIP", "Best Aper", "FMVP", "DPOS", "Best Reciever", "LuvLate Award"],
        { message: "Invalid award type, please match the enum values" }
    ),
    seasonId: z.number().int().positive({ message: "Season ID must be a positive number" }),
    imageUrl: z.string().url().optional(),
    playerIds: z.array(z.number().int().positive()).optional(),
    playerNames: z.array(z.string()).optional()
});

export const createAwardSchema = baseAwardSchema;

// Schema for creating award with player name
export const createAwardWithNamesSchema = z.object({
    description: z.string().min(1, { message: "Description is required" }),
    type: z.enum(
        ["MVP", "Best Spiker", "Best Server", "Best Blocker", "Best Libero", "Best Setter", "MIP", "Best Aper", "FMVP", "DPOS", "Best Receiver", "LuvLate Award"],
        { message: "Invalid award type, please match the enum values" }
    ),
    seasonId: z.number().int().positive({ message: "Season ID must be a positive number" }),
    playerName: z.string().min(1, { message: "Player name is required" }).transform(val => val.toLowerCase()),
    imageUrl: z.string().url().optional()
});

// Batch variant for creating multiple awards
export const createMultipleAwardsSchema = z.array(baseAwardSchema);

// Inferred DTOs
export type CreateAwardDto = z.infer<typeof createAwardSchema>;
export type CreateMultipleAwardsDto = z.infer<typeof createMultipleAwardsSchema>;

// Update schema (patch-like) - ID comes from URL params
export const updateAwardSchema = z.object({
    description: z.string().min(1, { message: "Description is required" }).optional(),
    type: z.enum(
        ["MVP", "Best Spiker", "Best Server", "Best Blocker", "Best Libero", "Best Setter", "MIP", "Best Aper", "FMVP", "DPOS", "Best Receiver", "LuvLate Award"],
        { message: "Invalid award type, please match the enum values" }
    ).optional(),
    seasonId: z.number().int().positive({ message: "Season ID must be a positive number" }).optional(),
    imageUrl: z.string().url().optional(),
    playerIds: z.array(z.number().int().positive()).optional(),
    playerName: z.string().min(1, { message: "Player name is required" }).transform(val => val.toLowerCase()).optional()
});

export type UpdateAwardDto = z.infer<typeof updateAwardSchema>; 
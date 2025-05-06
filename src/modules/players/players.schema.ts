import { z } from "zod";

export const createPlayerSchema = z.object({
    //Players name must be a non-empty string
    name: z.string().min(1, { message: "Player Name is required" }),
    //Players position must be a valid position from the enum
    position: z.enum(["N/A", "Setter", "Spiker", "Libero", "Defensive Specialist", "Pinch Server"] , { message: "Invalid position, please match the enum values" }),
    //Players team id must be a positive integer or null
    teamId: z.number().int().positive().nullable(),
    
});

export const createPlayerSchemaWithTeamName = createPlayerSchema.extend({
    teamName: z.string().min(1, { message: "Team Name is required" }),
});

export type CreatePlayerDto = z.infer<typeof createPlayerSchema>;

//we are using a partial extend to make all fields optional so we only update given fields
//we are also making sure the given player id is valid before we hand it to routes to try and update
//this is not adding any new fields, it is just updating given existing fields, I think it's kind of like a PATCH http method
export const updatePlayerSchema = createPlayerSchema.partial().extend({
    id: z.number().int().positive(),
});

// Inferred TypeScript type for updatePlayerSchema
export type UpdatePlayerDto = z.infer<typeof updatePlayerSchema>;

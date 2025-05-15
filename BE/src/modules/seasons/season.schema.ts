import { z } from 'zod';

export const createSeasonSchema = z.object({
    name: z.number().int().min(1, { message: "Season # is required and must be a positive integer " }),
    startDate: z.date(),
    endDate: z.date(),

    //check in to see how i should handle this relation in a zod schema
    // teams: z.array(z.number().int().positive()).optional(),
    // games: z.array(z.number().int().positive()).optional()
});

export const updateSeasonSchema = createSeasonSchema.partial().extend({
    id: z.number().int().positive(),
});

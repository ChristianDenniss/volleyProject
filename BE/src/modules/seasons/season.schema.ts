import { z } from 'zod';

export const createSeasonSchema = z.object({
    seasonNumber: z.number().int().min(1, { message: "Season # is required and must be a positive integer " }),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    image: z.string().url().optional(),
    theme: z.string().default("None"),

    //check in to see how i should handle this relation in a zod schema
    // teams: z.array(z.number().int().positive()).optional(),
    // games: z.array(z.number().int().positive()).optional()
});

export const updateSeasonSchema = createSeasonSchema.partial().extend({
    id: z.number().int().positive(),
});

/* DTO types */
export type CreateSeasonDto = z.infer<typeof createSeasonSchema>;
export type UpdateSeasonDto = z.infer<typeof updateSeasonSchema>;

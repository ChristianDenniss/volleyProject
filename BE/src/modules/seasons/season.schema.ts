// src/validation/season.schema.ts
import { z } from "zod";

// same as before
export const createSeasonSchema = z.object({
    seasonNumber: z
        .number()
        .int()
        .min(1, { message: "Season # is required and must be a positive integer" }),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    image: z.string().url().optional(),
    theme: z.string().default("None"),
    // (relations commented out)
});

// for PATCH we allow any subset of fields
export const updateSeasonSchema = createSeasonSchema.partial();

// Type for your controller
export type UpdateSeasonDto = z.infer<typeof updateSeasonSchema>;

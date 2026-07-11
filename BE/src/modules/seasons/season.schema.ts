import { z } from "zod";
import { REGION_CODES } from "../regions/region.entity.js";

export const createSeasonSchema = z.object({
    seasonNumber: z
        .number()
        .int()
        .min(1, { message: "Season # is required and must be a positive integer" }),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    image: z.string().url().optional(),
    theme: z.string().default("None"),
    regionId: z.number().int().positive().optional(),
    region: z.enum(REGION_CODES).optional(),
});

export const updateSeasonSchema = createSeasonSchema.partial();

import { z } from 'zod';

export const createGameSchema = z.object({
    team1Id: z.number().int().positive(),
    team2Id: z.number().int().positive(),
    seasonId: z.number().int().positive(),
    date: z.date(),
    team1Score: z.number().int().positive(),
    team2Score: z.number().int().positive(),
    stats: z.array(z.number().int().positive().optional()),
    videoUrl: z.string().optional(),
    stage: z.string().min(2, { message: "stage is required, min 2 characters" }),
});

export const updateGameSchema = createGameSchema.partial();         



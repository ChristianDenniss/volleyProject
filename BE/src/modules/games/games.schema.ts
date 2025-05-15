import { z } from 'zod';

export const createGameSchema = z.object({
    team1Id: z.number().int().positive(),
    team2Id: z.number().int().positive(),
    seasonId: z.number().int().positive(),
    date: z.date(),
    team1Score: z.number().int().positive(),
    team2Score: z.number().int().positive(),
    stats: z.array(z.number().int().positive().optional()),
});

export const updateGameSchema = createGameSchema.partial().extend({
    id: z.number().int().positive(),
});         



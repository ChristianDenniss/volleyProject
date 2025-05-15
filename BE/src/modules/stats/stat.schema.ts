import { z } from 'zod';

export const createStatSchema = z.object({
    playerId: z.number().int().positive(),
    gameId: z.number().int().positive(),

    spikingErrors: z.number().int().positive(),
    apeKills: z.number().int().positive(),
    apeAttempts: z.number().int().positive(),
    spikeKills: z.number().int().positive(),
    spikeAttempts: z.number().int().positive(),
    assists: z.number().int().positive(),
    blocks: z.number().int().positive(),
    digs: z.number().int().positive(),
    blockFollows: z.number().int().positive(),
    aces: z.number().int().positive(),
    miscErrors: z.number().int().positive(),

    
});

export const updateStatSchema = createStatSchema.partial().extend({
    id: z.number().int().positive(),
});


import { z } from 'zod';

export const createStatSchema = z.object({
    playerId: z.number().int().positive(),
    gameId: z.number().int().positive(),

    spikingErrors: z.number().int().nonnegative(),   // ← allow 0
    apeKills:      z.number().int().nonnegative(),
    apeAttempts:   z.number().int().nonnegative(),
    spikeKills:    z.number().int().nonnegative(),
    spikeAttempts: z.number().int().nonnegative(),
    assists:       z.number().int().nonnegative(),
    blocks:        z.number().int().nonnegative(),
    digs:          z.number().int().nonnegative(),
    blockFollows:  z.number().int().nonnegative(),
    aces:          z.number().int().nonnegative(),
    miscErrors:    z.number().int().nonnegative(),
    servingErrors: z.number().int().nonnegative(),
    settingErrors: z.number().int().nonnegative(),
});

export const updateStatSchema = createStatSchema.partial().extend({
    id: z.number().int().positive(),
});

// drop playerId, add playerName
export const createStatByNameSchema = createStatSchema
  .omit({ playerId: true })
  .extend({
    playerName: z.string().min(1, "Player name is required"),
  });


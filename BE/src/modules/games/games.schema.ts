import { z } from 'zod';
import { REGION_CODES } from '../regions/region.entity.js';
import { httpUrlSchema } from '../../utils/urlSchema.js';

export const gamePhaseSchema = z.enum(['qualifiers', 'playoffs', 'pre_season']);
export const gameBracketSchema = z.enum(['winners', 'losers']).nullable().optional();
export const regionCodeSchema = z.enum(REGION_CODES);

export const createGameSchema = z.object({
    team1Id: z.number().int().positive().optional(),
    team2Id: z.number().int().positive().optional(),
    seasonId: z.number().int().positive(),
    date: z.coerce.date(),
    team1Score: z.number().int().min(0).nullable().optional(),
    team2Score: z.number().int().min(0).nullable().optional(),
    stats: z.array(z.number().int().positive().optional()).optional(),
    videoUrl: z.union([httpUrlSchema, z.literal(""), z.null()]).optional(),
    stage: z.string().min(1, { message: "stage is required" }),
    status: z.enum(['scheduled', 'completed']).optional(),
    phase: gamePhaseSchema.optional(),
    bracket: gameBracketSchema,
    setScores: z.array(z.string()).max(5).optional(),
    tags: z.array(z.string()).optional(),
    name: z.string().optional(),
});

export const updateGameSchema = z.object({
    name: z.string().optional(),
    seasonId: z.number().int().positive().optional(),
    team1Score: z.number().int().min(0).nullable().optional(),
    team2Score: z.number().int().min(0).nullable().optional(),
    date: z.coerce.date().optional(),
    videoUrl: z.union([httpUrlSchema, z.literal(""), z.null()]).optional(),
    stage: z.string().optional(),
    status: z.enum(['scheduled', 'completed']).optional(),
    phase: gamePhaseSchema.optional(),
    bracket: gameBracketSchema,
    setScores: z.array(z.string()).max(5).optional(),
    tags: z.array(z.string()).optional(),
});

export const importChallongeSchema = z.object({
    challongeUrl: z.string().min(1),
    seasonId: z.number().int().positive(),
    round: z.string().optional(),
    roundStartDate: z.coerce.date(),
    roundEndDate: z.coerce.date(),
    matchSpacingMinutes: z.number().min(15).max(120).default(30),
    phase: gamePhaseSchema.default('qualifiers'),
    region: regionCodeSchema.default('na'),
    tags: z.array(z.string()).optional(),
    dryRun: z.boolean().optional(),
});

export type ImportChallongeInput = z.infer<typeof importChallongeSchema>;

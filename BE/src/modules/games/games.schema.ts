import { z } from 'zod';

export const createGameSchema = z.object({
    team1Id: z.number().int().positive().optional(),
    team2Id: z.number().int().positive().optional(),
    seasonId: z.number().int().positive(),
    date: z.coerce.date(),
    team1Score: z.number().int().min(0).nullable().optional(),
    team2Score: z.number().int().min(0).nullable().optional(),
    stats: z.array(z.number().int().positive().optional()).optional(),
    videoUrl: z.string().optional(),
    stage: z.string().min(2, { message: "stage is required, min 2 characters" }),
    status: z.enum(['scheduled', 'completed']).optional(),
    matchNumber: z.string().optional(),
    round: z.string().optional(),
    phase: z.enum(['qualifiers', 'playoffs']).optional(),
    region: z.enum(['na', 'eu', 'as', 'sa']).optional(),
    setScores: z.array(z.string()).max(5).optional(),
    tags: z.array(z.string()).optional(),
});

export const updateGameSchema = z.object({
    name: z.string().optional(),
    seasonId: z.number().int().positive().optional(),
    team1Score: z.number().int().min(0).nullable().optional(),
    team2Score: z.number().int().min(0).nullable().optional(),
    date: z.coerce.date().optional(),
    videoUrl: z.string().optional(),
    stage: z.string().optional(),
    status: z.enum(['scheduled', 'completed']).optional(),
    matchNumber: z.string().optional(),
    round: z.string().optional(),
    phase: z.enum(['qualifiers', 'playoffs']).optional(),
    region: z.enum(['na', 'eu', 'as', 'sa']).optional(),
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
    phase: z.enum(['qualifiers', 'playoffs']).default('qualifiers'),
    region: z.enum(['na', 'eu', 'as', 'sa']).default('na'),
    tags: z.array(z.string()).optional(),
    dryRun: z.boolean().optional(),
});

export type ImportChallongeInput = z.infer<typeof importChallongeSchema>;

import { z } from 'zod';

// Base schemas for related entities
export const TeamSchema = z.object({
    id: z.number(),
    name: z.string(),
    placement: z.string(),
    createdAt: z.date(),
    updatedAt: z.date()
});

export const PlayerSchema = z.object({
    id: z.number(),
    name: z.string(),
    position: z.string(),
    createdAt: z.date(),
    updatedAt: z.date()
});

export const SeasonSchema = z.object({
    id: z.number(),
    seasonNumber: z.number(),
    theme: z.string(),
    startDate: z.date(),
    endDate: z.date(),
    createdAt: z.date(),
    updatedAt: z.date()
});

export const AwardSchema = z.object({
    id: z.number(),
    type: z.string(),
    description: z.string().optional(),
    season: z.object({
        id: z.number(),
        seasonNumber: z.number()
    }).optional(),
    createdAt: z.date(),
    updatedAt: z.date()
});

export const StatSchema = z.object({
    id: z.number(),
    // Add other stat fields as needed
    createdAt: z.date(),
    updatedAt: z.date()
});

export const RecordSchema = z.object({
    id: z.number(),
    // Add other record fields as needed
    createdAt: z.date(),
    updatedAt: z.date()
});

export const GameSchema = z.object({
    id: z.number(),
    // Add other game fields as needed
    createdAt: z.date(),
    updatedAt: z.date()
});

// Trivia schemas
export const TriviaPlayerSchema = z.object({
    id: z.number(),
    name: z.string(),
    position: z.string(),
    teams: z.array(TeamSchema).default([]),
    awards: z.array(AwardSchema).default([]),
    stats: z.array(StatSchema).default([]),
    records: z.array(RecordSchema).default([]),
    difficulty: z.enum(['easy', 'medium', 'hard', 'impossible']),
    hintCount: z.number()
});

export const TriviaTeamSchema = z.object({
    id: z.number(),
    name: z.string(),
    placement: z.string(),
    players: z.array(PlayerSchema).default([]),
    games: z.array(GameSchema).default([]),
    season: SeasonSchema,
    difficulty: z.enum(['easy', 'medium', 'hard', 'impossible']),
    hintCount: z.number()
});

export const TriviaSeasonSchema = z.object({
    id: z.number(),
    seasonNumber: z.number(),
    theme: z.string(),
    startDate: z.date(),
    endDate: z.date(),
    teams: z.array(TeamSchema).default([]),
    games: z.array(GameSchema).default([]),
    awards: z.array(AwardSchema).default([]),
    records: z.array(RecordSchema).default([]),
    difficulty: z.enum(['easy', 'medium', 'hard']),
    hintCount: z.number()
});

// Request/Response schemas
export const DifficultyQuerySchema = z.object({
    difficulty: z.enum(['easy', 'medium', 'hard', 'impossible'])
});

export const GuessRequestSchema = z.object({
    type: z.enum(['player', 'team', 'season']),
    id: z.number(),
    guess: z.string().min(1)
});

export const GuessResultSchema = z.object({
    correct: z.boolean(),
    answer: z.string().optional(),
    message: z.string()
});

// Type exports for TypeScript
export type TriviaPlayer = z.infer<typeof TriviaPlayerSchema>;
export type TriviaTeam = z.infer<typeof TriviaTeamSchema>;
export type TriviaSeason = z.infer<typeof TriviaSeasonSchema>;
export type GuessResult = z.infer<typeof GuessResultSchema>;
export type DifficultyQuery = z.infer<typeof DifficultyQuerySchema>;
export type GuessRequest = z.infer<typeof GuessRequestSchema>; 
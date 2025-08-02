import { z } from 'zod';

export const setScoreSchema = z.object({
  setNumber: z.number().min(1).max(5),
  team1Score: z.number().min(0),
  team2Score: z.number().min(0),
  isWinningSet: z.boolean().optional()
});

export const createMatchSchema = z.object({
  matchNumber: z.string(),
  status: z.enum(['scheduled', 'completed']).default('scheduled'),
  round: z.string(),
  phase: z.enum(['qualifiers', 'playoffs']).default('qualifiers'),
  region: z.enum(['na', 'eu', 'as', 'sa']).default('na'),
  date: z.string().transform((str) => new Date(str)),
  team1Score: z.number().optional(),
  team2Score: z.number().optional(),
  setScores: z.array(z.string()).max(5).optional(), // Array of strings like ["25-20", "20-25", "25-22"]
  challongeMatchId: z.string().optional(),
  challongeTournamentId: z.string().optional(),
  challongeRound: z.number().optional(),
  seasonId: z.number(),
  team1Name: z.string().optional(), // Team name as string (from Challonge)
  team2Name: z.string().optional(), // Team name as string (from Challonge)
  tags: z.array(z.string()).optional() // Array of tags like ["RVL", "Invitational"]
});

export const updateMatchSchema = createMatchSchema.partial();

export const importChallongeSchema = z.object({
  challongeUrl: z.string().url(),
  seasonId: z.number(),
  round: z.string().optional(), // Optional round filter
  roundStartDate: z.string().transform((str) => new Date(str)), // Round start date/time
  roundEndDate: z.string().transform((str) => new Date(str)), // Round end date/time
  matchSpacingMinutes: z.number().min(15).max(120).default(30), // Minutes between matches
  tags: z.array(z.string()).optional() // Array of tags to apply to imported matches
});

export type CreateMatchInput = z.infer<typeof createMatchSchema>;
export type UpdateMatchInput = z.infer<typeof updateMatchSchema>;
export type ImportChallongeInput = z.infer<typeof importChallongeSchema>; 
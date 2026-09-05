import { z } from "zod";
import {
  AWARD_TYPES,
  MATCH_PHASES,
  MATCH_REGIONS,
  MATCH_STATUSES,
  RECORD_METRICS,
  RECORD_TYPES,
  USER_ROLES,
} from "@db/schema";
import { articleContentSchema } from "@/lib/tiptap-doc";

export const PLAYER_POSITIONS = [
  "N/A",
  "Setter",
  "Spiker",
  "Libero",
  "Defensive Specialist",
  "Pinch Server",
  "Developer",
] as const;

export const id = z.number().int().positive();
export const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "expected YYYY-MM-DD");
const count = z.number().int().nonnegative();
const url = z.string().url().nullable().optional();

export const byId = z.object({ id });
export const byUserId = z.object({ id: z.string().min(1) });

export const seasonCreate = z.object({
  seasonNumber: z.number().int().positive(),
  startDate: isoDate,
  endDate: isoDate.nullable().optional(),
  image: url,
  theme: z.string().min(1).nullable().optional(),
});
export const seasonUpdate = z.object({ id, patch: seasonCreate.partial() });

const sheetUrl = z.string().url();
const regionalUrls = z
  .object({
    na: sheetUrl.optional(),
    eu: sheetUrl.optional(),
    as: sheetUrl.optional(),
  })
  .optional();

export const sheetImportFull = z.object({
  mode: z.literal("full"),
  seasonNumber: z.number().int().positive(),
  startDate: isoDate,
  endDate: isoDate.nullable().optional(),
  theme: z.string().min(1).nullable().optional(),
  masterUrl: sheetUrl,
  regionalUrls,
  excludeTeamKeys: z.array(z.string()).optional(),
  excludeGameKeys: z.array(z.string()).optional(),
});

export const sheetImportTeams = z.object({
  mode: z.enum(["teams", "teams_and_players", "players"]),
  seasonId: id,
  masterUrl: sheetUrl.optional(),
  regionalUrls,
  excludeTeamKeys: z.array(z.string()).optional(),
  excludeGameKeys: z.array(z.string()).optional(),
});

export const teamCreate = z.object({
  name: z.string().min(1),
  logoUrl: url,
  description: z.string().max(500).nullable().optional(),
  placement: z.string().min(1).optional(),
  seasonId: id.nullable().optional(),
});
export const teamUpdate = z.object({ id, patch: teamCreate.partial() });
export const teamProfileUpdate = z.object({
  id,
  patch: z.object({
    logoUrl: url,
    description: z.string().max(500).nullable().optional(),
  }),
});

export const playerCreate = z
  .object({
    name: z.string().min(1),
    position: z.enum(PLAYER_POSITIONS).optional(),
    teamId: id.nullable().optional(),
    teamName: z.string().min(1).optional(),
  })
  .refine((value) => value.teamId != null || value.teamName != null, {
    message: "either teamId or teamName is required",
    path: ["teamId"],
  });

export const playerCreateByTeamName = z.object({
  name: z.string().min(1),
  position: z.enum(PLAYER_POSITIONS).optional(),
  teamName: z.string().min(1),
});

export const playerCreateMany = z.object({
  players: z
    .array(z.object({ name: z.string().min(1), position: z.enum(PLAYER_POSITIONS).optional() }))
    .min(1),
});

export const playerCreateManyByTeamName = playerCreateMany.extend({
  teamName: z.string().min(1),
});

export const playerUpdate = z.object({
  id,
  patch: z.object({ name: z.string().min(1).optional(), position: z.enum(PLAYER_POSITIONS).optional() }),
});

export const playerMerge = z.object({ targetId: id, mergedId: id });

const staffHandle = z.string().min(1).nullable().optional();
const setScore = z.string().regex(/^\d{1,3}-\d{1,3}$/).nullable().optional();

export const gameCreate = z.object({
  name: z.string().min(1).nullable().optional(),
  matchNumber: z.string().min(1).nullable().optional(),
  round: z.string().min(1).nullable().optional(),
  status: z.enum(MATCH_STATUSES).optional(),
  phase: z.enum(MATCH_PHASES).optional(),
  region: z.enum(MATCH_REGIONS).optional(),
  date: isoDate,
  seasonId: id,
  teamIds: z.array(id).length(2).optional(),
  team1Id: id.nullable().optional(),
  team2Id: id.nullable().optional(),
  team1Score: count.nullable().optional(),
  team2Score: count.nullable().optional(),
  set1Score: setScore,
  set2Score: setScore,
  set3Score: setScore,
  set4Score: setScore,
  set5Score: setScore,
  stage: z.string().min(1).optional(),
  videoUrl: url,
  streamer: staffHandle,
  referee: staffHandle,
  commentator: staffHandle,
  tags: z.array(z.string().min(1)).nullable().optional(),
});

export const gameCreateByNames = gameCreate
  .omit({ teamIds: true, team1Id: true, team2Id: true })
  .extend({ teamNames: z.array(z.string().min(1)).length(2) });

export const gameCreateMany = z.object({
  games: z
    .array(
      gameCreate.extend({
        teamIds: z.array(id).length(2),
        team1Score: count,
        team2Score: count,
      }),
    )
    .min(1),
});

export const gameUpdate = z.object({
  id,
  patch: gameCreate
    .partial()
    .extend({ teamIds: z.array(id).length(2).optional() }),
});

export const gameImportChallonge = z.object({
  tournamentId: z.string().min(1),
  seasonId: id,
  phase: z.enum(MATCH_PHASES).optional(),
  region: z.enum(MATCH_REGIONS).optional(),
  tags: z.array(z.string().min(1)).nullable().optional(),
});

const statCounts = z.object({
  spikeKills: count.optional(),
  spikeAttempts: count.optional(),
  spikingErrors: count.optional(),
  apeKills: count.optional(),
  apeAttempts: count.optional(),
  assists: count.optional(),
  settingErrors: count.optional(),
  blocks: count.optional(),
  blockFollows: count.optional(),
  digs: count.optional(),
  aces: count.optional(),
  servingErrors: count.optional(),
  miscErrors: count.optional(),
});

export const statCreate = statCounts.extend({ playerId: id, gameId: id });
export const statCreateByName = statCounts.extend({
  playerName: z.string().min(1),
  gameId: id,
});
export const statUpdate = z.object({ id, patch: statCounts });
export const statRows = z.object({
  gameId: id,
  rows: z.array(statCounts.extend({ playerName: z.string().min(1) })).min(1),
});

export const awardCreate = z.object({
  type: z.enum(AWARD_TYPES),
  description: z.string().min(1),
  imageUrl: url,
  seasonId: id,
  playerIds: z.array(id).optional(),
});
export const awardCreateWithNames = awardCreate
  .omit({ playerIds: true })
  .extend({ playerNames: z.array(z.string().min(1)).min(1) });
export const awardUpdate = z.object({ id, patch: awardCreate.partial() });

export const recordCreate = z.object({
  metric: z.enum(RECORD_METRICS),
  minAttempts: z.number().int().positive().nullable().optional(),
  type: z.enum(RECORD_TYPES),
  rank: z.number().int().min(1).max(10),
  value: z.number(),
  date: isoDate.nullable().optional(),
  seasonId: id,
  playerId: id,
  gameId: id.nullable().optional(),
});
export const recordUpdate = z.object({ id, patch: recordCreate.partial() });
export const recordRecalculate = z.object({ seasonId: id.optional() });

export const articleCreate = z.object({
  title: z.string().min(1),
  summary: z.string().min(1),
  content: articleContentSchema,
  imageUrl: z.string().url(),
});
export const articleUpdate = z.object({
  id,
  patch: articleCreate.partial().extend({ approved: z.boolean().nullable().optional() }),
});

export const userSetRole = z.object({ id: z.string().min(1), role: z.enum(USER_ROLES) });

export const triviaGuess = z.object({
  type: z.enum(["player", "team", "season"]),
  id,
  guess: z.string().min(1),
});

export const triviaSubject = z.object({
  difficulty: z.enum(["easy", "medium", "hard", "impossible"]),
  seed: z.number().min(0).max(1),
});

export const bySeason = z.object({ seasonId: id });
export const byTeamName = z.object({ name: z.string().min(1) });
export const optionalSeason = z.object({ seasonId: id.optional() });

export const STAGE_ROUNDS = ["R1", "R2", "R3", "R4", "R5", "R6", "all"] as const;

export const leaderboardInput = z.object({
  seasonId: id.optional(),
  stageRound: z.enum(STAGE_ROUNDS).optional(),
});
export const recordsByMetric = z.object({
  metric: z.enum(RECORD_METRICS),
  minAttempts: z.number().int().positive().nullable().optional(),
  type: z.enum(RECORD_TYPES).nullable().optional(),
});

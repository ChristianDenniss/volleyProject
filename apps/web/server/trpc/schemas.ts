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
import { UPLOAD_MAX_BYTES, UPLOAD_MIME_TYPES } from "@/lib/uploads";
import { articleContentSchema } from "@/lib/tiptap-doc";
import {
  COMPARISON_OPERATORS,
  FILTER_STAT_KEYS,
  LEADERBOARD_SORT_KEYS,
  MAX_FILTER_CONDITIONS,
  MAX_FILTER_VALUE,
  SORT_DIRECTIONS,
  STAT_TYPES,
} from "@/lib/stats/leaderboard-filters";

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

const parsedTeam = z.object({
  name: z.string(),
  region: z.enum(["na", "eu", "as"]).nullable(),
  playerNames: z.array(z.string()),
  leadership: z
    .object({
      C: z.string().optional(),
      VC: z.string().optional(),
      CC: z.string().optional(),
    })
    .optional(),
});

const parsedGame = z.object({
  key: z.string(),
  region: z.enum(["na", "eu", "as"]),
  phase: z.enum(["qualifiers", "playoffs"]),
  round: z.string(),
  date: z.string(),
  team1Name: z.string(),
  team2Name: z.string(),
  team1Score: z.number().nullable(),
  team2Score: z.number().nullable(),
  setScores: z.array(z.string()),
  forfeit: z.boolean(),
});

const sheetStatCounts = z.object({
  spikeKills: z.number(),
  spikeAttempts: z.number(),
  spikingErrors: z.number(),
  apeKills: z.number(),
  apeAttempts: z.number(),
  assists: z.number(),
  settingErrors: z.number(),
  blocks: z.number(),
  blockFollows: z.number(),
  digs: z.number(),
  aces: z.number(),
  servingErrors: z.number(),
  miscErrors: z.number(),
});

const parsedBlock = z.object({
  teamName: z.string(),
  region: z.enum(["na", "eu", "as"]),
  winnerName: z.string(),
  teamScore: z.number(),
  opponentScore: z.number(),
  rows: z.array(sheetStatCounts.extend({ playerName: z.string() })),
});

export const sheetImportSources = z.object({
  masterTeams: z.array(parsedTeam),
  masterGames: z.array(parsedGame),
  regionalTeams: z.array(parsedTeam),
  regionalBlocks: z.array(parsedBlock),
  sourceWarnings: z.array(z.string()),
});

const previewTeam = z.object({
  key: z.string(),
  name: z.string(),
  region: z.enum(["na", "eu", "as"]).nullable(),
  playerNames: z.array(z.string()),
  leadership: z
    .object({
      C: z.string().optional(),
      VC: z.string().optional(),
      CC: z.string().optional(),
    })
    .optional(),
  included: z.boolean(),
});

const previewGame = parsedGame.extend({
  matchedStatCount: z.number(),
  included: z.boolean(),
});

const previewStat = z.object({
  gameKey: z.string(),
  teamName: z.string(),
  playerName: z.string(),
  counts: sheetStatCounts,
});

/** Staged preview from assemblePreview — commit uses this instead of re-parsing sources. */
export const sheetImportPreviewSnapshot = z.object({
  mode: z.enum(["full", "teams", "teams_and_players", "players"]),
  seasonNumber: z.number().nullable(),
  seasonId: z.number().nullable(),
  counts: z.object({
    teams: z.number(),
    players: z.number(),
    playersNew: z.number(),
    playersExisting: z.number(),
    games: z.number(),
    stats: z.number(),
    warnings: z.number(),
    errors: z.number(),
  }),
  teams: z.array(previewTeam),
  players: z.array(
    z.object({
      name: z.string(),
      teamName: z.string(),
      exists: z.boolean(),
    }),
  ),
  games: z.array(previewGame),
  stats: z.array(previewStat),
  warnings: z.array(z.string()),
  errors: z.array(z.string()),
});

const sheetImportFilters = {
  excludeTeamKeys: z.array(z.string()).optional(),
  excludeGameKeys: z.array(z.string()).optional(),
};

const sheetImportSessionId = z.string().uuid();

const sheetImportCommitExtras = {
  ...sheetImportFilters,
  sessionId: sheetImportSessionId.optional(),
  sources: sheetImportSources.optional(),
  preview: sheetImportPreviewSnapshot.optional(),
};

const sheetImportFullShape = {
  mode: z.literal("full"),
  seasonNumber: z.number().int().positive(),
  startDate: isoDate,
  endDate: isoDate.nullable().optional(),
  theme: z.string().min(1).nullable().optional(),
  masterUrl: sheetUrl.optional(),
  regionalUrls,
  ...sheetImportCommitExtras,
} as const;

const sheetImportTeamsShape = {
  mode: z.enum(["teams", "teams_and_players", "players"]),
  seasonId: id,
  masterUrl: sheetUrl.optional(),
  regionalUrls,
  ...sheetImportCommitExtras,
} as const;

export const sheetImportFull = z.object(sheetImportFullShape).superRefine((data, ctx) => {
  if (!data.sessionId && !data.preview && !data.sources && !data.masterUrl) {
    ctx.addIssue({
      code: "custom",
      message: "Provide a session id, staged preview, sources from preview, or a master sheet URL",
      path: ["masterUrl"],
    });
  }
});

export const sheetImportTeams = z.object(sheetImportTeamsShape).superRefine((data, ctx) => {
  if (
    !data.sessionId &&
    !data.preview &&
    !data.sources &&
    !data.masterUrl &&
    !data.regionalUrls?.na &&
    !data.regionalUrls?.eu &&
    !data.regionalUrls?.as
  ) {
    ctx.addIssue({
      code: "custom",
      message: "Provide a session id, staged preview, sources from preview, or at least one sheet URL",
      path: ["sources"],
    });
  }
});

function requireSessionOrSources(
  data: { sessionId?: string | undefined; sources?: unknown },
  ctx: z.RefinementCtx,
) {
  if (!data.sessionId && !data.sources) {
    ctx.addIssue({
      code: "custom",
      message: "Provide a session id or staged sources",
      path: ["sessionId"],
    });
  }
}

/** Staged preview assembly — omit URL/preview fields (Zod forbids .omit on refined schemas). */
export const sheetImportAssembleFull = z
  .object({
    mode: z.literal("full"),
    seasonNumber: z.number().int().positive(),
    startDate: isoDate,
    endDate: isoDate.nullable().optional(),
    theme: z.string().min(1).nullable().optional(),
    ...sheetImportFilters,
    sessionId: sheetImportSessionId.optional(),
    sources: sheetImportSources.optional(),
  })
  .superRefine(requireSessionOrSources);

export const sheetImportAssembleTeams = z
  .object({
    mode: z.enum(["teams", "teams_and_players", "players"]),
    seasonId: id,
    ...sheetImportFilters,
    sessionId: sheetImportSessionId.optional(),
    sources: sheetImportSources.optional(),
  })
  .superRefine(requireSessionOrSources);

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

export const uploadRequest = z.object({
  filename: z.string().min(1).max(200),
  contentType: z.enum(UPLOAD_MIME_TYPES),
  bytes: z
    .number()
    .int()
    .positive()
    .max(UPLOAD_MAX_BYTES, `Image is larger than ${UPLOAD_MAX_BYTES} bytes`),
});

export const byUploadId = z.object({ id: z.string().uuid() });

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

export const regionValue = z.enum(MATCH_REGIONS).optional();

export const optionalRegion = z
  .object({
    region: regionValue,
  })
  .optional();

export const bySeason = z.object({
  seasonId: id,
  region: regionValue,
});
export const byTeamName = z.object({ name: z.string().min(1) });
export const optionalSeason = z.object({
  seasonId: id.optional(),
  region: regionValue,
});

export const pageQuery = z.object({
  page: z.number().int().positive().optional(),
  perPage: z.number().int().positive().max(100).optional(),
  search: z.string().max(120).optional(),
});

const seasonNumber = z.number().int().positive();

export const playerListPage = pageQuery.extend({
  region: regionValue,
  season: seasonNumber.optional(),
  position: z.string().max(60).optional(),
});

export const gameListPage = pageQuery.extend({
  region: regionValue,
  season: seasonNumber.optional(),
  stage: z.string().max(120).optional(),
});

export const teamListPage = pageQuery.extend({
  region: regionValue,
  season: seasonNumber.optional(),
  placement: z.string().max(60).optional(),
});

export const articleListPage = pageQuery.extend({
  approvedOnly: z.boolean().optional(),
  status: z.enum(["pending", "published", "rejected"]).optional(),
  sort: z.enum(["newest", "oldest", "likes", "title"]).optional(),
});

export const recordListPage = pageQuery.extend({
  region: regionValue,
});

export const recordGroupsPage = pageQuery.extend({
  region: regionValue,
  type: z.enum(RECORD_TYPES).optional(),
});

export const awardListPage = pageQuery.extend({
  season: seasonNumber.optional(),
  type: z.enum(AWARD_TYPES).optional(),
});

export const schedulePage = pageQuery.extend({
  seasonId: id.optional(),
  region: regionValue,
  status: z.enum(MATCH_STATUSES).optional(),
  round: z.string().max(120).optional(),
});

export const scheduleFilterOptions = z.object({
  seasonId: id.optional(),
  region: regionValue,
});

export const statListPage = pageQuery
  .extend({
    season: seasonNumber.optional(),
  })
  .optional();

export const STAGE_ROUNDS = ["R1", "R2", "R3", "R4", "R5", "R6", "all"] as const;

export const leaderboardInput = z.object({
  seasonId: id.optional(),
  stageRound: z.enum(STAGE_ROUNDS).optional(),
  region: regionValue,
});

export const leaderboardCondition = z.object({
  stat: z.enum(FILTER_STAT_KEYS),
  operator: z.enum(COMPARISON_OPERATORS),
  value: z.number().finite().min(-MAX_FILTER_VALUE).max(MAX_FILTER_VALUE),
});

export const leaderboardPage = pageQuery.extend({
  seasonId: id.optional(),
  stageRound: z.enum(STAGE_ROUNDS).optional(),
  region: regionValue,
  statType: z.enum(STAT_TYPES).optional(),
  sort: z.enum(LEADERBOARD_SORT_KEYS).optional(),
  dir: z.enum(SORT_DIRECTIONS).optional(),
  conditions: z.array(leaderboardCondition).max(MAX_FILTER_CONDITIONS).optional(),
});
export const recordsByMetric = z.object({
  metric: z.enum(RECORD_METRICS),
  minAttempts: z.number().int().positive().nullable().optional(),
  type: z.enum(RECORD_TYPES).nullable().optional(),
  region: regionValue,
});

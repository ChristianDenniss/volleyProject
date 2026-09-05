import { relations, sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  primaryKey,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

const now = () => new Date();

const inList = (values: readonly string[]) =>
  sql.raw(`(${values.map((value) => `'${value}'`).join(", ")})`);

const timestamps = {
  createdAt: integer({ mode: "timestamp_ms" }).notNull().$defaultFn(now),
  updatedAt: integer({ mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(now)
    .$onUpdateFn(now),
};

export const AWARD_TYPES = [
  "MVP",
  "Best Spiker",
  "Best Server",
  "Best Blocker",
  "Best Libero",
  "Best Setter",
  "MIP",
  "Best Aper",
  "FMVP",
  "DPOS",
  "Best Receiver",
  "LuvLate Award",
] as const;

export const RECORD_METRICS = [
  "spike kills",
  "assists",
  "ape kills",
  "digs",
  "block follows",
  "blocks",
  "aces",
  "serve errors",
  "misc errors",
  "set errors",
  "spike errors",
  "spike attempts",
  "ape attempts",
  "total kills",
  "total attempts",
  "total errors",
  "spiking percentage",
] as const;

export const RECORD_TYPES = ["game", "season"] as const;
export const MATCH_STATUSES = ["scheduled", "completed"] as const;
export const MATCH_PHASES = ["qualifiers", "playoffs"] as const;
export const MATCH_REGIONS = ["na", "eu", "as", "sa"] as const;
export const USER_ROLES = ["user", "admin", "superadmin"] as const;
export const JOB_STATUSES = ["queued", "running", "succeeded", "failed"] as const;
export const CONTRIBUTION_ROLES = ["streamed", "reffed", "commentated"] as const;
export type ContributionRole = (typeof CONTRIBUTION_ROLES)[number];
/** Team leadership: Captain, Vice Captain, Co-Captain. */
export const TEAM_LEADERSHIP_ROLES = ["C", "VC", "CC"] as const;
export type TeamLeadershipRole = (typeof TEAM_LEADERSHIP_ROLES)[number];

export const user = sqliteTable("user", {
  id: text().primaryKey(),
  name: text().notNull(),
  email: text().notNull().unique(),
  emailVerified: integer({ mode: "boolean" }).notNull().default(false),
  image: text(),
  role: text({ enum: USER_ROLES }).notNull().default("user"),
  banned: integer({ mode: "boolean" }).notNull().default(false),
  banReason: text(),
  banExpires: integer({ mode: "timestamp_ms" }),
  ...timestamps,
});

export const session = sqliteTable(
  "session",
  {
    id: text().primaryKey(),
    token: text().notNull().unique(),
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    expiresAt: integer({ mode: "timestamp_ms" }).notNull(),
    ipAddress: text(),
    userAgent: text(),
    impersonatedBy: text(),
    ...timestamps,
  },
  (table) => [index("session_user_id_idx").on(table.userId)],
);

export const account = sqliteTable(
  "account",
  {
    id: text().primaryKey(),
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accountId: text().notNull(),
    providerId: text().notNull(),
    accessToken: text(),
    refreshToken: text(),
    idToken: text(),
    accessTokenExpiresAt: integer({ mode: "timestamp_ms" }),
    refreshTokenExpiresAt: integer({ mode: "timestamp_ms" }),
    scope: text(),
    password: text(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("account_provider_account_idx").on(table.providerId, table.accountId),
    index("account_user_id_idx").on(table.userId),
  ],
);

export const verification = sqliteTable(
  "verification",
  {
    id: text().primaryKey(),
    identifier: text().notNull(),
    value: text().notNull(),
    expiresAt: integer({ mode: "timestamp_ms" }).notNull(),
    ...timestamps,
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

export const seasons = sqliteTable(
  "seasons",
  {
    id: integer().primaryKey({ autoIncrement: true }),
    seasonNumber: integer().notNull(),
    startDate: text().notNull(),
    endDate: text(),
    image: text(),
    theme: text(),
    ...timestamps,
  },
  (table) => [uniqueIndex("seasons_season_number_idx").on(table.seasonNumber)],
);

export const teams = sqliteTable(
  "teams",
  {
    id: integer().primaryKey({ autoIncrement: true }),
    name: text().notNull(),
    logoUrl: text(),
    description: text(),
    placement: text().notNull().default("Didnt make playoffs"),
    seasonId: integer().references(() => seasons.id, { onDelete: "cascade" }),
    ...timestamps,
  },
  (table) => [
    index("teams_season_id_idx").on(table.seasonId),
    uniqueIndex("teams_name_season_idx").on(table.name, table.seasonId),
  ],
);

export const players = sqliteTable(
  "players",
  {
    id: integer().primaryKey({ autoIncrement: true }),
    name: text().notNull(),
    position: text().notNull().default("N/A"),
    robloxUserId: text(),
    userId: text().references(() => user.id, { onDelete: "set null" }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("players_name_idx").on(table.name),
    uniqueIndex("players_roblox_user_id_idx").on(table.robloxUserId),
    uniqueIndex("players_user_id_idx").on(table.userId),
  ],
);

export const games = sqliteTable(
  "games",
  {
    id: integer().primaryKey({ autoIncrement: true }),
    name: text(),
    matchNumber: text(),
    round: text(),
    status: text({ enum: MATCH_STATUSES }).notNull().default("completed"),
    phase: text({ enum: MATCH_PHASES }).notNull().default("qualifiers"),
    region: text({ enum: MATCH_REGIONS }).notNull().default("na"),
    team1Score: integer(),
    team2Score: integer(),
    set1Score: text(),
    set2Score: text(),
    set3Score: text(),
    set4Score: text(),
    set5Score: text(),
    date: text().notNull(),
    videoUrl: text(),
    stage: text().notNull().default("Winners Bracket; Round of 16"),
    seasonId: integer().references(() => seasons.id, { onDelete: "cascade" }),
    challongeMatchId: text(),
    challongeTournamentId: text(),
    challongeRound: integer(),
    tags: text({ mode: "json" }).$type<string[]>(),
    ...timestamps,
  },
  (table) => [
    index("games_season_id_idx").on(table.seasonId),
    index("games_date_idx").on(table.date),
    index("games_round_idx").on(table.round),
    check("games_status_check", sql`${table.status} in ${inList(MATCH_STATUSES)}`),
    check("games_phase_check", sql`${table.phase} in ${inList(MATCH_PHASES)}`),
    check("games_region_check", sql`${table.region} in ${inList(MATCH_REGIONS)}`),
  ],
);

export const stats = sqliteTable(
  "stats",
  {
    id: integer().primaryKey({ autoIncrement: true }),
    playerId: integer()
      .notNull()
      .references(() => players.id, { onDelete: "cascade" }),
    gameId: integer()
      .notNull()
      .references(() => games.id, { onDelete: "cascade" }),
    spikeKills: integer().notNull().default(0),
    spikeAttempts: integer().notNull().default(0),
    spikingErrors: integer().notNull().default(0),
    apeKills: integer().notNull().default(0),
    apeAttempts: integer().notNull().default(0),
    assists: integer().notNull().default(0),
    settingErrors: integer().notNull().default(0),
    blocks: integer().notNull().default(0),
    blockFollows: integer().notNull().default(0),
    digs: integer().notNull().default(0),
    aces: integer().notNull().default(0),
    servingErrors: integer().notNull().default(0),
    miscErrors: integer().notNull().default(0),
    ...timestamps,
  },
  (table) => [
    index("stats_player_id_idx").on(table.playerId),
    index("stats_game_id_idx").on(table.gameId),
    uniqueIndex("stats_player_game_idx").on(table.playerId, table.gameId),
  ],
);

export const awards = sqliteTable(
  "awards",
  {
    id: integer().primaryKey({ autoIncrement: true }),
    type: text({ enum: AWARD_TYPES }).notNull().default("MVP"),
    description: text().notNull(),
    imageUrl: text(),
    seasonId: integer()
      .notNull()
      .references(() => seasons.id, { onDelete: "cascade" }),
    ...timestamps,
  },
  (table) => [
    index("awards_season_id_idx").on(table.seasonId),
    index("awards_type_idx").on(table.type),
    check("awards_type_check", sql`${table.type} in ${inList(AWARD_TYPES)}`),
  ],
);

export const records = sqliteTable(
  "records",
  {
    id: integer().primaryKey({ autoIncrement: true }),
    metric: text({ enum: RECORD_METRICS }).notNull(),
    minAttempts: integer(),
    type: text({ enum: RECORD_TYPES }).notNull().default("game"),
    rank: integer().notNull(),
    value: real().notNull(),
    date: text(),
    seasonId: integer()
      .notNull()
      .references(() => seasons.id, { onDelete: "cascade" }),
    playerId: integer()
      .notNull()
      .references(() => players.id, { onDelete: "cascade" }),
    gameId: integer().references(() => games.id, { onDelete: "cascade" }),
    ...timestamps,
  },
  (table) => [
    index("records_season_id_idx").on(table.seasonId),
    index("records_player_id_idx").on(table.playerId),
    uniqueIndex("records_family_rank_idx").on(
      table.seasonId,
      table.type,
      table.metric,
      table.minAttempts,
      table.rank,
    ),
    check("records_metric_check", sql`${table.metric} in ${inList(RECORD_METRICS)}`),
    check("records_type_check", sql`${table.type} in ${inList(RECORD_TYPES)}`),
    check("records_rank_check", sql`${table.rank} between 1 and 10`),
  ],
);

export const articles = sqliteTable(
  "articles",
  {
    id: integer().primaryKey({ autoIncrement: true }),
    title: text().notNull(),
    summary: text().notNull(),
    content: text().notNull(),
    imageUrl: text().notNull(),
    approved: integer({ mode: "boolean" }),
    likes: integer().notNull().default(0),
    authorId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    ...timestamps,
  },
  (table) => [index("articles_author_id_idx").on(table.authorId)],
);

export const teamsPlayers = sqliteTable(
  "teams_players",
  {
    teamId: integer()
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    playerId: integer()
      .notNull()
      .references(() => players.id, { onDelete: "cascade" }),
    role: text({ enum: TEAM_LEADERSHIP_ROLES }),
  },
  (table) => [
    primaryKey({ columns: [table.teamId, table.playerId] }),
    index("teams_players_player_id_idx").on(table.playerId),
    uniqueIndex("teams_players_team_role_idx").on(table.teamId, table.role),
    check(
      "teams_players_role_check",
      sql`${table.role} is null or ${table.role} in ${inList(TEAM_LEADERSHIP_ROLES)}`,
    ),
  ],
);

export const teamsGames = sqliteTable(
  "teams_games",
  {
    gameId: integer()
      .notNull()
      .references(() => games.id, { onDelete: "cascade" }),
    slot: integer().notNull(),
    teamId: integer()
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.gameId, table.slot] }),
    check("teams_games_slot_check", sql`${table.slot} in (1, 2)`),
    index("teams_games_team_id_idx").on(table.teamId),
  ],
);

export const awardsPlayers = sqliteTable(
  "awards_players",
  {
    awardId: integer()
      .notNull()
      .references(() => awards.id, { onDelete: "cascade" }),
    playerId: integer()
      .notNull()
      .references(() => players.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.awardId, table.playerId] }),
    index("awards_players_player_id_idx").on(table.playerId),
  ],
);

export const gameStaff = sqliteTable(
  "game_staff",
  {
    id: integer().primaryKey({ autoIncrement: true }),
    role: text({ enum: CONTRIBUTION_ROLES }).notNull(),
    gameId: integer()
      .notNull()
      .references(() => games.id, { onDelete: "cascade" }),
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("game_staff_game_role_idx").on(table.gameId, table.role),
    index("game_staff_user_id_idx").on(table.userId),
    check("game_staff_role_check", sql`${table.role} in ${inList(CONTRIBUTION_ROLES)}`),
  ],
);

export const articleLikes = sqliteTable(
  "article_likes",
  {
    articleId: integer()
      .notNull()
      .references(() => articles.id, { onDelete: "cascade" }),
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: integer({ mode: "timestamp_ms" }).notNull().$defaultFn(now),
  },
  (table) => [
    primaryKey({ columns: [table.articleId, table.userId] }),
    index("article_likes_user_id_idx").on(table.userId),
  ],
);

export const jobRuns = sqliteTable(
  "job_runs",
  {
    id: text().primaryKey(),
    kind: text().notNull(),
    status: text({ enum: JOB_STATUSES }).notNull().default("queued"),
    requestedBy: text().references(() => user.id, { onDelete: "set null" }),
    startedAt: integer({ mode: "timestamp_ms" }),
    finishedAt: integer({ mode: "timestamp_ms" }),
    rowsWritten: integer().notNull().default(0),
    error: text(),
    ...timestamps,
  },
  (table) => [
    index("job_runs_kind_idx").on(table.kind),
    check("job_runs_status_check", sql`${table.status} in ${inList(JOB_STATUSES)}`),
  ],
);

export const userRelations = relations(user, ({ many, one }) => ({
  sessions: many(session),
  accounts: many(account),
  articles: many(articles),
  likes: many(articleLikes),
  gameStaff: many(gameStaff),
  player: one(players, { fields: [user.id], references: [players.userId] }),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, { fields: [session.userId], references: [user.id] }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, { fields: [account.userId], references: [user.id] }),
}));

export const seasonsRelations = relations(seasons, ({ many }) => ({
  teams: many(teams),
  games: many(games),
  awards: many(awards),
  records: many(records),
}));

export const teamsRelations = relations(teams, ({ one, many }) => ({
  season: one(seasons, { fields: [teams.seasonId], references: [seasons.id] }),
  players: many(teamsPlayers),
  games: many(teamsGames),
}));

export const playersRelations = relations(players, ({ many, one }) => ({
  teams: many(teamsPlayers),
  stats: many(stats),
  awards: many(awardsPlayers),
  records: many(records),
  user: one(user, { fields: [players.userId], references: [user.id] }),
}));

export const gamesRelations = relations(games, ({ one, many }) => ({
  season: one(seasons, { fields: [games.seasonId], references: [seasons.id] }),
  teams: many(teamsGames),
  stats: many(stats),
  staff: many(gameStaff),
}));

export const statsRelations = relations(stats, ({ one }) => ({
  player: one(players, { fields: [stats.playerId], references: [players.id] }),
  game: one(games, { fields: [stats.gameId], references: [games.id] }),
}));

export const awardsRelations = relations(awards, ({ one, many }) => ({
  season: one(seasons, { fields: [awards.seasonId], references: [seasons.id] }),
  players: many(awardsPlayers),
}));

export const recordsRelations = relations(records, ({ one }) => ({
  season: one(seasons, { fields: [records.seasonId], references: [seasons.id] }),
  player: one(players, { fields: [records.playerId], references: [players.id] }),
  game: one(games, { fields: [records.gameId], references: [games.id] }),
}));

export const articlesRelations = relations(articles, ({ one, many }) => ({
  author: one(user, { fields: [articles.authorId], references: [user.id] }),
  likedBy: many(articleLikes),
}));

export const teamsPlayersRelations = relations(teamsPlayers, ({ one }) => ({
  team: one(teams, { fields: [teamsPlayers.teamId], references: [teams.id] }),
  player: one(players, { fields: [teamsPlayers.playerId], references: [players.id] }),
}));

export const teamsGamesRelations = relations(teamsGames, ({ one }) => ({
  team: one(teams, { fields: [teamsGames.teamId], references: [teams.id] }),
  game: one(games, { fields: [teamsGames.gameId], references: [games.id] }),
}));

export const awardsPlayersRelations = relations(awardsPlayers, ({ one }) => ({
  award: one(awards, { fields: [awardsPlayers.awardId], references: [awards.id] }),
  player: one(players, { fields: [awardsPlayers.playerId], references: [players.id] }),
}));

export const articleLikesRelations = relations(articleLikes, ({ one }) => ({
  article: one(articles, { fields: [articleLikes.articleId], references: [articles.id] }),
  user: one(user, { fields: [articleLikes.userId], references: [user.id] }),
}));

export const gameStaffRelations = relations(gameStaff, ({ one }) => ({
  game: one(games, { fields: [gameStaff.gameId], references: [games.id] }),
  user: one(user, { fields: [gameStaff.userId], references: [user.id] }),
}));

export type User = typeof user.$inferSelect;
export type Season = typeof seasons.$inferSelect;
export type Team = typeof teams.$inferSelect;
export type Player = typeof players.$inferSelect;
export type Game = typeof games.$inferSelect;
export type Stat = typeof stats.$inferSelect;
export type Award = typeof awards.$inferSelect;
export type Record_ = typeof records.$inferSelect;
export type Article = typeof articles.$inferSelect;
export type JobRun = typeof jobRuns.$inferSelect;
export type GameStaff = typeof gameStaff.$inferSelect;

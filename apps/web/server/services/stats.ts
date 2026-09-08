import { and, asc, desc, eq, inArray, or, sql, type SQL } from "drizzle-orm";
import type { Db } from "@db";
import { chunkValues, insertMany } from "@db/insert";
import { games, players, seasons, stats, teams, teamsPlayers } from "@db/schema";
import type { VectorGraphPlayer } from "@/lib/analytics/stats-vectorization";
import {
  EQUALITY_EPSILON,
  PERCENTAGE_STATS,
  type FilterStatKey,
  type LeaderboardSortKey,
  type SortDirection,
  type StatCondition,
  type StatType,
} from "@/lib/stats/leaderboard-filters";
import { STAGE_ROUNDS, type StageRound } from "@/lib/stats/stage-rounds";
import type { GameRegion } from "./games";
import { ConflictError, found, NotFoundError } from "./errors";
import type { PartialInput } from "./input";
import {
  emptyPage,
  likePattern,
  makePage,
  pageBounds,
  searchTerm,
  type Page,
  type PageQuery,
} from "./paging";

export interface StatInput {
  playerId: number;
  gameId: number;
  spikeKills?: number | undefined;
  spikeAttempts?: number | undefined;
  spikingErrors?: number | undefined;
  apeKills?: number | undefined;
  apeAttempts?: number | undefined;
  assists?: number | undefined;
  settingErrors?: number | undefined;
  blocks?: number | undefined;
  blockFollows?: number | undefined;
  digs?: number | undefined;
  aces?: number | undefined;
  servingErrors?: number | undefined;
  miscErrors?: number | undefined;
}

export interface StatRowByName extends Omit<StatInput, "playerId" | "gameId"> {
  playerName: string;
}

const detail = {
  id: stats.id,
  playerId: stats.playerId,
  playerName: players.name,
  gameId: stats.gameId,
  gameName: games.name,
  gameDate: games.date,
  seasonId: games.seasonId,
  spikeKills: stats.spikeKills,
  spikeAttempts: stats.spikeAttempts,
  spikingErrors: stats.spikingErrors,
  apeKills: stats.apeKills,
  apeAttempts: stats.apeAttempts,
  assists: stats.assists,
  settingErrors: stats.settingErrors,
  blocks: stats.blocks,
  blockFollows: stats.blockFollows,
  digs: stats.digs,
  aces: stats.aces,
  servingErrors: stats.servingErrors,
  miscErrors: stats.miscErrors,
};

export async function list(db: Db) {
  return db
    .select(detail)
    .from(stats)
    .innerJoin(players, eq(stats.playerId, players.id))
    .innerJoin(games, eq(stats.gameId, games.id))
    .orderBy(desc(games.date));
}

export interface StatListFilters extends PageQuery {
  season?: number | undefined;
}

function statFilters(filters: StatListFilters) {
  const term = searchTerm(filters);
  return and(
    filters.season !== undefined ? eq(seasons.seasonNumber, filters.season) : undefined,
    term
      ? sql`(
          lower(${players.name}) like ${likePattern(term)} escape '\\'
          or lower(coalesce(${games.name}, '')) like ${likePattern(term)} escape '\\'
        )`
      : undefined,
  );
}

export async function listPage(db: Db, filters: StatListFilters = {}) {
  const bounds = pageBounds(filters);
  const where = statFilters(filters);

  const [counted] = await db
    .select({ total: sql<number>`count(*)` })
    .from(stats)
    .innerJoin(players, eq(stats.playerId, players.id))
    .innerJoin(games, eq(stats.gameId, games.id))
    .leftJoin(seasons, eq(games.seasonId, seasons.id))
    .where(where);

  const total = Number(counted?.total ?? 0);
  if (total === 0) return emptyPage<Awaited<ReturnType<typeof list>>[number]>(bounds);

  const rows = await db
    .select(detail)
    .from(stats)
    .innerJoin(players, eq(stats.playerId, players.id))
    .innerJoin(games, eq(stats.gameId, games.id))
    .leftJoin(seasons, eq(games.seasonId, seasons.id))
    .where(where)
    .orderBy(desc(games.date), asc(stats.id))
    .limit(bounds.perPage)
    .offset(bounds.offset);

  return makePage(rows, total, bounds);
}

export async function getById(db: Db, id: number) {
  const row = await db
    .select(detail)
    .from(stats)
    .innerJoin(players, eq(stats.playerId, players.id))
    .innerJoin(games, eq(stats.gameId, games.id))
    .where(eq(stats.id, id))
    .get();
  return row ?? null;
}

export async function listByPlayer(db: Db, playerId: number) {
  return db
    .select(detail)
    .from(stats)
    .innerJoin(players, eq(stats.playerId, players.id))
    .innerJoin(games, eq(stats.gameId, games.id))
    .where(eq(stats.playerId, playerId))
    .orderBy(asc(games.date));
}

export async function listByGame(db: Db, gameId: number) {
  return db
    .select(detail)
    .from(stats)
    .innerJoin(players, eq(stats.playerId, players.id))
    .innerJoin(games, eq(stats.gameId, games.id))
    .where(eq(stats.gameId, gameId))
    .orderBy(asc(players.name));
}

export async function count(db: Db) {
  return db.$count(stats);
}

export async function vectorGraph(db: Db, region?: GameRegion): Promise<VectorGraphPlayer[]> {
  const rows = await db
    .select({
      playerId: players.id,
      playerName: players.name,
      spikeKills: stats.spikeKills,
      spikeAttempts: stats.spikeAttempts,
      spikingErrors: stats.spikingErrors,
      apeKills: stats.apeKills,
      apeAttempts: stats.apeAttempts,
      assists: stats.assists,
      settingErrors: stats.settingErrors,
      blocks: stats.blocks,
      blockFollows: stats.blockFollows,
      digs: stats.digs,
      aces: stats.aces,
      servingErrors: stats.servingErrors,
      miscErrors: stats.miscErrors,
      team1Score: games.team1Score,
      team2Score: games.team2Score,
      seasonNumber: seasons.seasonNumber,
    })
    .from(stats)
    .innerJoin(players, eq(stats.playerId, players.id))
    .innerJoin(games, eq(stats.gameId, games.id))
    .innerJoin(seasons, eq(games.seasonId, seasons.id))
    .where(region ? eq(games.region, region) : undefined)
    .orderBy(asc(players.name), desc(games.date));

  const byPlayer = new Map<number, VectorGraphPlayer>();
  for (const row of rows) {
    let player = byPlayer.get(row.playerId);
    if (!player) {
      player = { id: row.playerId, name: row.playerName, stats: [] };
      byPlayer.set(row.playerId, player);
    }
    player.stats.push({
      spikeKills: row.spikeKills,
      spikeAttempts: row.spikeAttempts,
      spikingErrors: row.spikingErrors,
      apeKills: row.apeKills,
      apeAttempts: row.apeAttempts,
      assists: row.assists,
      settingErrors: row.settingErrors,
      blocks: row.blocks,
      blockFollows: row.blockFollows,
      digs: row.digs,
      aces: row.aces,
      servingErrors: row.servingErrors,
      miscErrors: row.miscErrors,
      game: {
        team1Score: row.team1Score,
        team2Score: row.team2Score,
        season: { seasonNumber: row.seasonNumber },
      },
    });
  }
  return [...byPlayer.values()];
}

const totalKills = sql<number>`sum(${stats.spikeKills} + ${stats.apeKills})`;
const totalAttempts = sql<number>`sum(${stats.spikeAttempts} + ${stats.apeAttempts})`;
const totalErrors = sql<number>`sum(${stats.spikingErrors} + ${stats.settingErrors} + ${stats.servingErrors} + ${stats.miscErrors})`;

export interface LeaderboardOptions {
  seasonId?: number | undefined;
  stageRound?: StageRound | undefined;
  region?: GameRegion | undefined;
}

function buildStageRoundFilter(stageRound: StageRound | undefined) {
  if (!stageRound || stageRound === "all") return undefined;

  const keys = STAGE_ROUNDS[stageRound];
  if (keys.length === 0) return undefined;

  return or(
    ...keys.map((key) => {
      const stageMatch = sql`${games.stage} LIKE ${`%${key.stage}%`}`;
      if (key.bracket === "winners") {
        return sql`${games.stage} LIKE '%Winners%' AND ${stageMatch}`;
      }
      if (key.bracket === "losers") {
        return sql`${games.stage} LIKE '%Losers%' AND ${stageMatch}`;
      }
      return stageMatch;
    }),
  );
}

const leaderboardColumns = {
  playerId: players.id,
  playerName: players.name,
  robloxUserId: players.robloxUserId,
  position: players.position,
  gamesPlayed: sql<number>`count(distinct ${stats.gameId})`,
  totalSets: sql<number>`coalesce(sum(${games.team1Score} + ${games.team2Score}), 0)`,
  spikeKills: sql<number>`sum(${stats.spikeKills})`,
  spikeAttempts: sql<number>`sum(${stats.spikeAttempts})`,
  apeKills: sql<number>`sum(${stats.apeKills})`,
  apeAttempts: sql<number>`sum(${stats.apeAttempts})`,
  totalKills,
  totalAttempts,
  spikingErrors: sql<number>`sum(${stats.spikingErrors})`,
  totalErrors,
  assists: sql<number>`sum(${stats.assists})`,
  settingErrors: sql<number>`sum(${stats.settingErrors})`,
  blocks: sql<number>`sum(${stats.blocks})`,
  blockFollows: sql<number>`sum(${stats.blockFollows})`,
  digs: sql<number>`sum(${stats.digs})`,
  aces: sql<number>`sum(${stats.aces})`,
  servingErrors: sql<number>`sum(${stats.servingErrors})`,
  miscErrors: sql<number>`sum(${stats.miscErrors})`,
  spikingPercentage: sql<number>`case when sum(${stats.spikeAttempts} + ${stats.apeAttempts}) = 0 then 0 else round(100.0 * sum(${stats.spikeKills} + ${stats.apeKills}) / sum(${stats.spikeAttempts} + ${stats.apeAttempts}), 2) end`,
};

export async function leaderboard(db: Db, options: LeaderboardOptions = {}) {
  const { seasonId, stageRound, region } = options;
  const stageFilter = buildStageRoundFilter(stageRound);

  const query = db
    .select(leaderboardColumns)
    .from(stats)
    .innerJoin(players, eq(stats.playerId, players.id))
    .innerJoin(games, eq(stats.gameId, games.id))
    .groupBy(players.id)
    .orderBy(desc(totalKills));

  const filters = [
    seasonId === undefined ? undefined : eq(games.seasonId, seasonId),
    stageFilter,
    region ? eq(games.region, region) : undefined,
  ].filter(Boolean);

  const baseQuery =
    filters.length === 0
      ? query
      : filters.length === 1
        ? query.where(filters[0])
        : query.where(and(...filters));

  const rows = await baseQuery;

  if (seasonId === undefined) {
    return rows.map((row) => ({ ...row, teamName: null, teamLogoUrl: null }));
  }

  const memberships = await db
    .select({
      playerId: teamsPlayers.playerId,
      teamName: teams.name,
      teamLogoUrl: teams.logoUrl,
    })
    .from(teamsPlayers)
    .innerJoin(teams, eq(teamsPlayers.teamId, teams.id))
    .where(eq(teams.seasonId, seasonId));

  const teamByPlayer = new Map(memberships.map((entry) => [entry.playerId, entry]));

  return rows.map((row) => {
    const team = teamByPlayer.get(row.playerId);
    return {
      ...row,
      teamName: team?.teamName ?? null,
      teamLogoUrl: team?.teamLogoUrl ?? null,
    };
  });
}

const gamesPlayedExpr = sql`count(distinct ${stats.gameId})`;
const totalSetsExpr = sql`coalesce(sum(${games.team1Score} + ${games.team2Score}), 0)`;

const RAW_STAT_SQL: Record<FilterStatKey, SQL> = {
  spikeKills: sql`coalesce(sum(${stats.spikeKills}), 0)`,
  spikeAttempts: sql`coalesce(sum(${stats.spikeAttempts}), 0)`,
  "Spike%": sql`case when coalesce(sum(${stats.spikeAttempts}), 0) = 0 then 0 else 100.0 * sum(${stats.spikeKills}) / sum(${stats.spikeAttempts}) end`,
  apeKills: sql`coalesce(sum(${stats.apeKills}), 0)`,
  apeAttempts: sql`coalesce(sum(${stats.apeAttempts}), 0)`,
  "Ape%": sql`case when coalesce(sum(${stats.apeAttempts}), 0) = 0 then 0 else 100.0 * sum(${stats.apeKills}) / sum(${stats.apeAttempts}) end`,
  totalKills: sql`coalesce(sum(${stats.spikeKills} + ${stats.apeKills}), 0)`,
  totalAttempts: sql`coalesce(sum(${stats.spikeAttempts} + ${stats.apeAttempts}), 0)`,
  "totalSpike%": sql`case when coalesce(sum(${stats.spikeAttempts} + ${stats.apeAttempts}), 0) = 0 then 0 else round(100.0 * sum(${stats.spikeKills} + ${stats.apeKills}) / sum(${stats.spikeAttempts} + ${stats.apeAttempts}), 2) end`,
  spikingErrors: sql`coalesce(sum(${stats.spikingErrors}), 0)`,
  blocks: sql`coalesce(sum(${stats.blocks}), 0)`,
  assists: sql`coalesce(sum(${stats.assists}), 0)`,
  settingErrors: sql`coalesce(sum(${stats.settingErrors}), 0)`,
  digs: sql`coalesce(sum(${stats.digs}), 0)`,
  blockFollows: sql`coalesce(sum(${stats.blockFollows}), 0)`,
  totalReceives: sql`coalesce(sum(${stats.digs} + ${stats.blockFollows}), 0)`,
  aces: sql`coalesce(sum(${stats.aces}), 0)`,
  servingErrors: sql`coalesce(sum(${stats.servingErrors}), 0)`,
  PRF: sql`coalesce(sum(${stats.spikeKills} + ${stats.apeKills} + ${stats.aces} + ${stats.assists}), 0)`,
  plusMinus: sql`coalesce(sum(${stats.spikeKills} + ${stats.apeKills} + ${stats.aces} + ${stats.assists} - ${stats.spikingErrors} - ${stats.settingErrors} - ${stats.servingErrors} - ${stats.miscErrors}), 0)`,
  totalErrors: sql`coalesce(sum(${stats.spikingErrors} + ${stats.settingErrors} + ${stats.servingErrors} + ${stats.miscErrors}), 0)`,
  miscErrors: sql`coalesce(sum(${stats.miscErrors}), 0)`,
  gamesPlayed: gamesPlayedExpr,
};

function scaledStat(stat: FilterStatKey, statType: StatType): SQL {
  const raw = RAW_STAT_SQL[stat];
  if (statType === "total" || PERCENTAGE_STATS.has(stat)) return raw;

  const denominator = statType === "perGame" ? gamesPlayedExpr : totalSetsExpr;
  return sql`coalesce((${raw}) * 1.0 / nullif(${denominator}, 0), 0)`;
}

function conditionSql(condition: StatCondition, statType: StatType): SQL {
  const expression = scaledStat(condition.stat, statType);
  const value = condition.value;

  switch (condition.operator) {
    case "==":
      return sql`abs((${expression}) - ${value}) < ${EQUALITY_EPSILON}`;
    case "!=":
      return sql`abs((${expression}) - ${value}) >= ${EQUALITY_EPSILON}`;
    case ">":
      return sql`(${expression}) > ${value}`;
    case ">=":
      return sql`(${expression}) >= ${value}`;
    case "<":
      return sql`(${expression}) < ${value}`;
    case "<=":
      return sql`(${expression}) <= ${value}`;
  }
}

function teamNameInSeason(seasonId: number): SQL {
  return sql`(
    select ${teams.name} from ${teamsPlayers}
    inner join ${teams} on ${teams.id} = ${teamsPlayers.teamId}
    where ${teamsPlayers.playerId} = ${players.id} and ${teams.seasonId} = ${seasonId}
    limit 1
  )`;
}

function leaderboardOrder(
  sort: LeaderboardSortKey,
  dir: SortDirection,
  statType: StatType,
  seasonId: number | undefined,
): SQL {
  const expression =
    sort === "playerName"
      ? sql`${players.name}`
      : sort === "teamName"
        ? seasonId === undefined
          ? sql`${players.name}`
          : teamNameInSeason(seasonId)
        : scaledStat(sort, statType);

  return dir === "asc" ? sql`${expression} asc` : sql`${expression} desc`;
}

export interface LeaderboardPageFilters extends PageQuery {
  seasonId?: number | undefined;
  stageRound?: StageRound | undefined;
  region?: GameRegion | undefined;
  statType?: StatType | undefined;
  sort?: LeaderboardSortKey | undefined;
  dir?: SortDirection | undefined;
  conditions?: readonly StatCondition[] | undefined;
}

export interface LeaderboardPageRow {
  playerId: number;
  playerName: string;
  robloxUserId: string | null;
  position: string;
  gamesPlayed: number;
  totalSets: number;
  spikeKills: number;
  spikeAttempts: number;
  apeKills: number;
  apeAttempts: number;
  totalKills: number;
  totalAttempts: number;
  spikingErrors: number;
  totalErrors: number;
  assists: number;
  settingErrors: number;
  blocks: number;
  blockFollows: number;
  digs: number;
  aces: number;
  servingErrors: number;
  miscErrors: number;
  spikingPercentage: number;
  teamName: string | null;
  teamLogoUrl: string | null;
}

function leaderboardWhere(filters: LeaderboardPageFilters) {
  const term = searchTerm(filters);
  return and(
    filters.seasonId === undefined ? undefined : eq(games.seasonId, filters.seasonId),
    buildStageRoundFilter(filters.stageRound),
    filters.region ? eq(games.region, filters.region) : undefined,
    term ? sql`lower(${players.name}) like ${likePattern(term)} escape '\\'` : undefined,
  );
}

async function seasonTeams(db: Db, seasonId: number, playerIds: number[]) {
  const byPlayer = new Map<number, { teamName: string; teamLogoUrl: string | null }>();
  if (playerIds.length === 0) return byPlayer;

  for (const chunk of chunkValues(playerIds)) {
    const rows = await db
      .select({
        playerId: teamsPlayers.playerId,
        teamName: teams.name,
        teamLogoUrl: teams.logoUrl,
      })
      .from(teamsPlayers)
      .innerJoin(teams, eq(teamsPlayers.teamId, teams.id))
      .where(and(eq(teams.seasonId, seasonId), inArray(teamsPlayers.playerId, chunk)));

    for (const row of rows) {
      if (!byPlayer.has(row.playerId)) {
        byPlayer.set(row.playerId, { teamName: row.teamName, teamLogoUrl: row.teamLogoUrl });
      }
    }
  }

  return byPlayer;
}

export async function leaderboardPage(
  db: Db,
  filters: LeaderboardPageFilters = {},
): Promise<Page<LeaderboardPageRow>> {
  const bounds = pageBounds(filters);
  const statType = filters.statType ?? "total";
  const sort = filters.sort ?? "totalKills";
  const dir = filters.dir ?? (sort === "playerName" || sort === "teamName" ? "asc" : "desc");
  const where = leaderboardWhere(filters);
  const conditions = filters.conditions ?? [];
  const having =
    conditions.length === 0
      ? undefined
      : and(...conditions.map((condition) => conditionSql(condition, statType)));

  const grouped = db
    .select({ playerId: players.id })
    .from(stats)
    .innerJoin(players, eq(stats.playerId, players.id))
    .innerJoin(games, eq(stats.gameId, games.id))
    .where(where)
    .groupBy(players.id)
    .having(having)
    .as("leaderboard_groups");

  const [counted] = await db.select({ total: sql<number>`count(*)` }).from(grouped);
  const total = Number(counted?.total ?? 0);
  if (total === 0) return emptyPage<LeaderboardPageRow>(bounds);

  const rows = await db
    .select(leaderboardColumns)
    .from(stats)
    .innerJoin(players, eq(stats.playerId, players.id))
    .innerJoin(games, eq(stats.gameId, games.id))
    .where(where)
    .groupBy(players.id)
    .having(having)
    .orderBy(leaderboardOrder(sort, dir, statType, filters.seasonId), asc(players.id))
    .limit(bounds.perPage)
    .offset(bounds.offset);

  if (filters.seasonId === undefined) {
    return makePage(
      rows.map((row) => ({ ...row, teamName: null, teamLogoUrl: null })),
      total,
      bounds,
    );
  }

  const byPlayer = await seasonTeams(
    db,
    filters.seasonId,
    rows.map((row) => row.playerId),
  );

  return makePage(
    rows.map((row) => {
      const team = byPlayer.get(row.playerId);
      return {
        ...row,
        teamName: team?.teamName ?? null,
        teamLogoUrl: team?.teamLogoUrl ?? null,
      };
    }),
    total,
    bounds,
  );
}

async function assertPair(db: Db, playerId: number, gameId: number) {
  const [player, game] = await Promise.all([
    db.query.players.findFirst({ where: eq(players.id, playerId) }),
    db.query.games.findFirst({ where: eq(games.id, gameId) }),
  ]);
  if (!player) throw new NotFoundError(`Player ${playerId}`);
  if (!game) throw new NotFoundError(`Game ${gameId}`);
}

export async function create(db: Db, input: StatInput) {
  await assertPair(db, input.playerId, input.gameId);
  const existing = await db.query.stats.findFirst({
    where: and(eq(stats.playerId, input.playerId), eq(stats.gameId, input.gameId)),
  });
  if (existing) throw new ConflictError("That player already has a stat line for that game");

  const [row] = await db.insert(stats).values(input).returning();
  return row;
}

export async function createByName(
  db: Db,
  input: Omit<StatInput, "playerId"> & { playerName: string },
) {
  const { playerName, ...rest } = input;
  const player = await db.query.players.findFirst({
    where: eq(players.name, playerName.toLowerCase()),
  });
  if (!player) throw new NotFoundError(`Player "${playerName}"`);
  return create(db, { ...rest, playerId: player.id });
}

export async function createManyFromRows(db: Db, gameId: number, rows: StatRowByName[]) {
  const game = await db.query.games.findFirst({ where: eq(games.id, gameId) });
  if (!game) throw new NotFoundError(`Game ${gameId}`);

  const roster = await db.select({ id: players.id, name: players.name }).from(players);
  const byName = new Map(roster.map((player) => [player.name.toLowerCase(), player.id]));

  const unknown = rows.filter((row) => !byName.has(row.playerName.toLowerCase()));
  if (unknown.length > 0) {
    throw new NotFoundError(`Players ${unknown.map((row) => row.playerName).join(", ")}`);
  }

  const values = rows.map((row) => {
    const { playerName, ...rest } = row;
    return { ...rest, gameId, playerId: byName.get(playerName.toLowerCase()) as number };
  });

  await insertMany(db, stats, values);
  return { gameId, inserted: values.length };
}

export async function addToGame(db: Db, gameId: number, rows: StatRowByName[]) {
  return createManyFromRows(db, gameId, rows);
}

export async function update(db: Db, id: number, input: PartialInput<Omit<StatInput, "playerId" | "gameId">>) {
  const [row] = await db.update(stats).set(input).where(eq(stats.id, id)).returning();
  return found(row, `Stat ${id}`);
}

export async function remove(db: Db, id: number) {
  const [row] = await db.delete(stats).where(eq(stats.id, id)).returning({ id: stats.id });
  found(row, `Stat ${id}`);
  return { id };
}

import { and, asc, desc, eq, or, sql } from "drizzle-orm";
import type { Db } from "@db";
import { insertMany } from "@db/insert";
import { games, players, seasons, stats, teams, teamsPlayers } from "@db/schema";
import type { VectorGraphPlayer } from "@/lib/analytics/stats-vectorization";
import { STAGE_ROUNDS, type StageRound } from "@/lib/stats/stage-rounds";
import { ConflictError, found, NotFoundError } from "./errors";
import type { PartialInput } from "./input";

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

export async function vectorGraph(db: Db): Promise<VectorGraphPlayer[]> {
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

export async function leaderboard(db: Db, options: LeaderboardOptions = {}) {
  const { seasonId, stageRound } = options;
  const stageFilter = buildStageRoundFilter(stageRound);

  const query = db
    .select({
      playerId: players.id,
      playerName: players.name,
      robloxUserId: players.robloxUserId,
      position: players.position,
      gamesPlayed: sql<number>`count(distinct ${stats.gameId})`,
      totalSets: sql<number>`sum(${games.team1Score} + ${games.team2Score})`,
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
    })
    .from(stats)
    .innerJoin(players, eq(stats.playerId, players.id))
    .innerJoin(games, eq(stats.gameId, games.id))
    .groupBy(players.id)
    .orderBy(desc(totalKills));

  const filters = [
    seasonId === undefined ? undefined : eq(games.seasonId, seasonId),
    stageFilter,
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

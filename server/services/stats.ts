import { and, asc, desc, eq, sql } from "drizzle-orm";
import type { Db } from "@db";
import { insertMany } from "@db/insert";
import { games, players, stats } from "@db/schema";
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

const totalKills = sql<number>`sum(${stats.spikeKills} + ${stats.apeKills})`;
const totalAttempts = sql<number>`sum(${stats.spikeAttempts} + ${stats.apeAttempts})`;
const totalErrors = sql<number>`sum(${stats.spikingErrors} + ${stats.settingErrors} + ${stats.servingErrors} + ${stats.miscErrors})`;

export async function leaderboard(db: Db, seasonId?: number) {
  const query = db
    .select({
      playerId: players.id,
      playerName: players.name,
      position: players.position,
      gamesPlayed: sql<number>`count(distinct ${stats.gameId})`,
      spikeKills: sql<number>`sum(${stats.spikeKills})`,
      apeKills: sql<number>`sum(${stats.apeKills})`,
      totalKills,
      totalAttempts,
      totalErrors,
      assists: sql<number>`sum(${stats.assists})`,
      blocks: sql<number>`sum(${stats.blocks})`,
      blockFollows: sql<number>`sum(${stats.blockFollows})`,
      digs: sql<number>`sum(${stats.digs})`,
      aces: sql<number>`sum(${stats.aces})`,
      servingErrors: sql<number>`sum(${stats.servingErrors})`,
      spikingPercentage: sql<number>`case when sum(${stats.spikeAttempts} + ${stats.apeAttempts}) = 0 then 0 else round(100.0 * sum(${stats.spikeKills} + ${stats.apeKills}) / sum(${stats.spikeAttempts} + ${stats.apeAttempts}), 2) end`,
    })
    .from(stats)
    .innerJoin(players, eq(stats.playerId, players.id))
    .innerJoin(games, eq(stats.gameId, games.id))
    .groupBy(players.id)
    .orderBy(desc(totalKills));

  return seasonId === undefined ? query : query.where(eq(games.seasonId, seasonId));
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

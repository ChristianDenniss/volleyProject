import { and, asc, eq, isNull } from "drizzle-orm";
import type { Db } from "@db";
import { games, players, RECORD_METRICS, RECORD_TYPES, records, seasons } from "@db/schema";
import { found, NotFoundError } from "./errors";
import type { PartialInput } from "./input";

export type RecordMetric = (typeof RECORD_METRICS)[number];
export type RecordType = (typeof RECORD_TYPES)[number];

export interface RecordInput {
  metric: RecordMetric;
  minAttempts?: number | null | undefined;
  type: RecordType;
  rank: number;
  value: number;
  date?: string | null | undefined;
  seasonId: number;
  playerId: number;
  gameId?: number | null | undefined;
}

const columns = {
  id: records.id,
  metric: records.metric,
  minAttempts: records.minAttempts,
  type: records.type,
  rank: records.rank,
  value: records.value,
  date: records.date,
  seasonId: records.seasonId,
  seasonNumber: seasons.seasonNumber,
  playerId: records.playerId,
  playerName: players.name,
  gameId: records.gameId,
  gameName: games.name,
};

const base = (db: Db) =>
  db
    .select(columns)
    .from(records)
    .innerJoin(players, eq(records.playerId, players.id))
    .leftJoin(seasons, eq(records.seasonId, seasons.id))
    .leftJoin(games, eq(records.gameId, games.id));

export async function list(db: Db) {
  return base(db).orderBy(asc(records.metric), asc(records.minAttempts), asc(records.rank));
}

export async function listBySeason(db: Db, seasonId: number) {
  return base(db)
    .where(eq(records.seasonId, seasonId))
    .orderBy(asc(records.metric), asc(records.minAttempts), asc(records.rank));
}

export async function listByMetric(db: Db, metric: RecordMetric, minAttempts?: number | null) {
  return base(db)
    .where(
      and(
        eq(records.metric, metric),
        minAttempts === undefined || minAttempts === null
          ? isNull(records.minAttempts)
          : eq(records.minAttempts, minAttempts),
      ),
    )
    .orderBy(asc(records.rank));
}

export async function listByPlayer(db: Db, playerId: number) {
  return base(db).where(eq(records.playerId, playerId)).orderBy(asc(records.rank));
}

export async function top10(
  db: Db,
  metric: RecordMetric,
  seasonId: number,
  minAttempts?: number | null | undefined,
) {
  return base(db)
    .where(
      and(
        eq(records.metric, metric),
        eq(records.seasonId, seasonId),
        minAttempts === undefined || minAttempts === null
          ? isNull(records.minAttempts)
          : eq(records.minAttempts, minAttempts),
      ),
    )
    .orderBy(asc(records.rank));
}

export async function getById(db: Db, id: number) {
  const row = await base(db).where(eq(records.id, id)).get();
  return row ?? null;
}

export async function count(db: Db) {
  return db.$count(records);
}

export async function create(db: Db, input: RecordInput) {
  const [season, player] = await Promise.all([
    db.query.seasons.findFirst({ where: eq(seasons.id, input.seasonId) }),
    db.query.players.findFirst({ where: eq(players.id, input.playerId) }),
  ]);
  if (!season) throw new NotFoundError(`Season ${input.seasonId}`);
  if (!player) throw new NotFoundError(`Player ${input.playerId}`);

  const [row] = await db.insert(records).values(input).returning();
  return row;
}

export async function update(db: Db, id: number, input: PartialInput<RecordInput>) {
  const [row] = await db.update(records).set(input).where(eq(records.id, id)).returning();
  return found(row, `Record ${id}`);
}

export async function remove(db: Db, id: number) {
  const [row] = await db.delete(records).where(eq(records.id, id)).returning({ id: records.id });
  found(row, `Record ${id}`);
  return { id };
}

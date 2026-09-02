import { asc, eq, inArray } from "drizzle-orm";
import type { Db } from "@db";
import { insertMany } from "@db/insert";
import { AWARD_TYPES, awards, awardsPlayers, players, seasons } from "@db/schema";
import { found, inserted, NotFoundError } from "./errors";
import type { PartialInput } from "./input";

export type AwardType = (typeof AWARD_TYPES)[number];

export interface AwardInput {
  type: AwardType;
  description: string;
  imageUrl?: string | null | undefined;
  seasonId: number;
  playerIds?: number[] | undefined;
}

const columns = {
  id: awards.id,
  type: awards.type,
  description: awards.description,
  imageUrl: awards.imageUrl,
  seasonId: awards.seasonId,
  seasonNumber: seasons.seasonNumber,
};

interface PlayerRef {
  id: number;
  name: string;
  position: string;
}

async function attachPlayers<T extends { id: number }>(db: Db, rows: T[]) {
  if (rows.length === 0) return rows.map((row) => ({ ...row, players: [] as PlayerRef[] }));

  const links = await db
    .select({
      awardId: awardsPlayers.awardId,
      id: players.id,
      name: players.name,
      position: players.position,
    })
    .from(awardsPlayers)
    .innerJoin(players, eq(awardsPlayers.playerId, players.id))
    .where(
      inArray(
        awardsPlayers.awardId,
        rows.map((row) => row.id),
      ),
    );

  const byAward = new Map<number, PlayerRef[]>();
  for (const link of links) {
    const bucket = byAward.get(link.awardId) ?? [];
    bucket.push({ id: link.id, name: link.name, position: link.position });
    byAward.set(link.awardId, bucket);
  }

  return rows.map((row) => ({ ...row, players: byAward.get(row.id) ?? [] }));
}

export async function list(db: Db) {
  const rows = await db
    .select(columns)
    .from(awards)
    .leftJoin(seasons, eq(awards.seasonId, seasons.id))
    .orderBy(asc(awards.type));
  return attachPlayers(db, rows);
}

export async function listBySeason(db: Db, seasonId: number) {
  const rows = await db
    .select(columns)
    .from(awards)
    .leftJoin(seasons, eq(awards.seasonId, seasons.id))
    .where(eq(awards.seasonId, seasonId))
    .orderBy(asc(awards.type));
  return attachPlayers(db, rows);
}

export async function listBySeasonNumber(db: Db, seasonNumber: number) {
  const season = await db.query.seasons.findFirst({
    where: eq(seasons.seasonNumber, seasonNumber),
  });
  if (!season) return null;
  return listBySeason(db, season.id);
}

export async function listByType(db: Db, type: AwardType) {
  const rows = await db
    .select(columns)
    .from(awards)
    .leftJoin(seasons, eq(awards.seasonId, seasons.id))
    .where(eq(awards.type, type));
  return attachPlayers(db, rows);
}

export async function listByPlayer(db: Db, playerId: number) {
  const rows = await db
    .select(columns)
    .from(awardsPlayers)
    .innerJoin(awards, eq(awardsPlayers.awardId, awards.id))
    .leftJoin(seasons, eq(awards.seasonId, seasons.id))
    .where(eq(awardsPlayers.playerId, playerId));
  return attachPlayers(db, rows);
}

export async function getById(db: Db, id: number) {
  const row = await db
    .select(columns)
    .from(awards)
    .leftJoin(seasons, eq(awards.seasonId, seasons.id))
    .where(eq(awards.id, id))
    .get();
  if (!row) return null;
  const [hydrated] = await attachPlayers(db, [row]);
  return hydrated;
}

export async function count(db: Db) {
  return db.$count(awards);
}

export async function create(db: Db, input: AwardInput) {
  const season = await db.query.seasons.findFirst({ where: eq(seasons.id, input.seasonId) });
  if (!season) throw new NotFoundError(`Season ${input.seasonId}`);

  const { playerIds = [], ...values } = input;
  const [created] = await db.insert(awards).values(values).returning();
  const row = inserted(created, "Award");

  if (playerIds.length > 0) {
    await insertMany(
      db,
      awardsPlayers,
      playerIds.map((playerId) => ({ awardId: row.id, playerId })),
    );
  }

  return row;
}

export async function createWithPlayerNames(
  db: Db,
  input: Omit<AwardInput, "playerIds"> & { playerNames: string[] },
) {
  const names = input.playerNames.map((name) => name.toLowerCase());
  const matched = await db.select().from(players).where(inArray(players.name, names));
  if (matched.length !== names.length) {
    const missing = names.filter((name) => !matched.some((player) => player.name === name));
    throw new NotFoundError(`Players ${missing.join(", ")}`);
  }
  const { playerNames: _playerNames, ...rest } = input;
  return create(db, { ...rest, playerIds: matched.map((player) => player.id) });
}

export async function update(db: Db, id: number, input: PartialInput<AwardInput>) {
  const { playerIds, ...values } = input;
  const [row] = await db.update(awards).set(values).where(eq(awards.id, id)).returning();
  found(row, `Award ${id}`);

  if (playerIds) {
    await db.delete(awardsPlayers).where(eq(awardsPlayers.awardId, id));
    await insertMany(
      db,
      awardsPlayers,
      playerIds.map((playerId) => ({ awardId: id, playerId })),
    );
  }

  return row;
}

export async function remove(db: Db, id: number) {
  const [row] = await db.delete(awards).where(eq(awards.id, id)).returning({ id: awards.id });
  found(row, `Award ${id}`);
  return { id };
}

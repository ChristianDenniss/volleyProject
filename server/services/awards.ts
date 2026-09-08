import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import type { Db } from "@db";
import { insertMany, chunkIds, chunkValues } from "@db/insert";
import { type AWARD_TYPES, awards, awardsPlayers, players, seasons } from "@db/schema";
import { found, inserted, NotFoundError } from "./errors";
import type { PartialInput } from "./input";
import {
  emptyPage,
  likePattern,
  makePage,
  pageBounds,
  searchTerm,
  type PageQuery,
} from "./paging";

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

  const awardIds = rows.map((row) => row.id);
  const links = [];
  for (const chunk of chunkIds(awardIds)) {
    const part = await db
      .select({
        awardId: awardsPlayers.awardId,
        id: players.id,
        name: players.name,
        position: players.position,
      })
      .from(awardsPlayers)
      .innerJoin(players, eq(awardsPlayers.playerId, players.id))
      .where(inArray(awardsPlayers.awardId, chunk));
    links.push(...part);
  }

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

export interface AwardListFilters extends PageQuery {
  season?: number | undefined;
  type?: AwardType | undefined;
}

function awardFilters(filters: AwardListFilters) {
  const term = searchTerm(filters);
  return and(
    filters.season === undefined ? undefined : eq(seasons.seasonNumber, filters.season),
    filters.type ? eq(awards.type, filters.type) : undefined,
    term
      ? sql`(
          lower(${awards.type}) like ${likePattern(term)} escape '\\'
          or lower(coalesce(${awards.description}, '')) like ${likePattern(term)} escape '\\'
        )`
      : undefined,
  );
}

export async function listTypes(db: Db) {
  const rows = await db.selectDistinct({ type: awards.type }).from(awards).orderBy(asc(awards.type));
  return rows.map((row) => row.type);
}

export async function listSeasonNumbers(db: Db) {
  const rows = await db
    .selectDistinct({ seasonNumber: seasons.seasonNumber })
    .from(awards)
    .innerJoin(seasons, eq(awards.seasonId, seasons.id))
    .orderBy(desc(seasons.seasonNumber));

  return rows.map((row) => row.seasonNumber);
}

export async function listPage(db: Db, filters: AwardListFilters = {}) {
  const bounds = pageBounds(filters);
  const where = awardFilters(filters);

  const [counted] = await db
    .select({ total: sql<number>`count(*)` })
    .from(awards)
    .leftJoin(seasons, eq(awards.seasonId, seasons.id))
    .where(where);

  const total = Number(counted?.total ?? 0);
  if (total === 0) return emptyPage<Awaited<ReturnType<typeof list>>[number]>(bounds);

  const rows = await db
    .select(columns)
    .from(awards)
    .leftJoin(seasons, eq(awards.seasonId, seasons.id))
    .where(where)
    .orderBy(asc(awards.type), asc(awards.id))
    .limit(bounds.perPage)
    .offset(bounds.offset);

  return makePage(await attachPlayers(db, rows), total, bounds);
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
  const matched: (typeof players.$inferSelect)[] = [];
  for (const chunk of chunkValues(names)) {
    const part = await db.select().from(players).where(inArray(players.name, chunk));
    matched.push(...part);
  }
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

import { asc, desc, eq } from "drizzle-orm";
import type { Db } from "@db";
import { correlatedCount } from "@db/sqlx";
import { awards, games, matches, records, seasons, teams } from "@db/schema";
import { found } from "./errors";

export interface SeasonInput {
  seasonNumber: number;
  startDate: string;
  endDate?: string | null;
  image?: string | null;
  theme?: string | null;
}

export async function list(db: Db) {
  return db
    .select({
      id: seasons.id,
      seasonNumber: seasons.seasonNumber,
      startDate: seasons.startDate,
      endDate: seasons.endDate,
      image: seasons.image,
      theme: seasons.theme,
      teamCount: correlatedCount("teams", "season_id", "seasons", "id"),
      gameCount: correlatedCount("games", "season_id", "seasons", "id"),
    })
    .from(seasons)
    .orderBy(desc(seasons.seasonNumber));
}

export async function getById(db: Db, id: number) {
  const season = await db.query.seasons.findFirst({ where: eq(seasons.id, id) });
  if (!season) return null;

  const [seasonTeams, seasonGames, seasonAwards, seasonMatches] = await Promise.all([
    db.select().from(teams).where(eq(teams.seasonId, id)).orderBy(asc(teams.name)),
    db.select().from(games).where(eq(games.seasonId, id)).orderBy(asc(games.date)),
    db.select().from(awards).where(eq(awards.seasonId, id)),
    db.select().from(matches).where(eq(matches.seasonId, id)).orderBy(asc(matches.date)),
  ]);

  return { ...season, teams: seasonTeams, games: seasonGames, awards: seasonAwards, matches: seasonMatches };
}

export async function getBySeasonNumber(db: Db, seasonNumber: number) {
  return (
    (await db.query.seasons.findFirst({ where: eq(seasons.seasonNumber, seasonNumber) })) ?? null
  );
}

export async function count(db: Db) {
  return db.$count(seasons);
}

export async function create(db: Db, input: SeasonInput) {
  const [row] = await db.insert(seasons).values(input).returning();
  return row;
}

export async function update(db: Db, id: number, input: Partial<SeasonInput>) {
  const [row] = await db.update(seasons).set(input).where(eq(seasons.id, id)).returning();
  return found(row, `Season ${id}`);
}

export async function remove(db: Db, id: number) {
  const [row] = await db.delete(seasons).where(eq(seasons.id, id)).returning({ id: seasons.id });
  found(row, `Season ${id}`);
  await db.delete(records).where(eq(records.seasonId, id));
  return { id };
}

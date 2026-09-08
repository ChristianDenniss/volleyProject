import { and, asc, desc, eq, isNotNull, or, sql } from "drizzle-orm";
import type { Db } from "@db";
import { correlatedCount } from "@db/sqlx";
import { awards, games, records, seasons, teams, teamsGames } from "@db/schema";
import { found } from "./errors";
import type { GameRegion } from "./games";
import type { PartialInput } from "./input";

export interface SeasonInput {
  seasonNumber: number;
  startDate: string;
  endDate?: string | null | undefined;
  image?: string | null | undefined;
  theme?: string | null | undefined;
}

export async function list(db: Db, region?: GameRegion) {
  const teamCount = region
    ? sql<number>`(select count(distinct "teams_games"."team_id") from "games" inner join "teams_games" on "teams_games"."game_id" = "games"."id" where "games"."season_id" = "seasons"."id" and "games"."region" = ${region})`
    : correlatedCount("teams", "season_id", "seasons", "id");
  const gameCount = region
    ? sql<number>`(select count(*) from "games" where "games"."season_id" = "seasons"."id" and "games"."region" = ${region})`
    : correlatedCount("games", "season_id", "seasons", "id");

  return db
    .select({
      id: seasons.id,
      seasonNumber: seasons.seasonNumber,
      startDate: seasons.startDate,
      endDate: seasons.endDate,
      image: seasons.image,
      theme: seasons.theme,
      teamCount,
      gameCount,
    })
    .from(seasons)
    .orderBy(desc(seasons.seasonNumber));
}

export async function getById(db: Db, id: number, region?: GameRegion) {
  const season = await db.query.seasons.findFirst({ where: eq(seasons.id, id) });
  if (!season) return null;

  const regionClause = region ? eq(games.region, region) : undefined;

  const [seasonGames, seasonAwards, seasonSchedule, seasonTeams] = await Promise.all([
    db
      .select()
      .from(games)
      .where(and(eq(games.seasonId, id), regionClause))
      .orderBy(asc(games.date)),
    db.select().from(awards).where(eq(awards.seasonId, id)),
    db
      .select()
      .from(games)
      .where(
        and(
          eq(games.seasonId, id),
          or(isNotNull(games.matchNumber), eq(games.status, "scheduled")),
          regionClause,
        ),
      )
      .orderBy(asc(games.date)),
    region
      ? db
          .select()
          .from(teams)
          .where(
            and(
              eq(teams.seasonId, id),
              sql`${teams.id} in (
                select distinct ${teamsGames.teamId} from ${teamsGames}
                inner join ${games} on ${teamsGames.gameId} = ${games.id}
                where ${games.seasonId} = ${id} and ${games.region} = ${region}
              )`,
            ),
          )
          .orderBy(asc(teams.name))
      : db.select().from(teams).where(eq(teams.seasonId, id)).orderBy(asc(teams.name)),
  ]);

  return { ...season, teams: seasonTeams, games: seasonGames, awards: seasonAwards, schedule: seasonSchedule };
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

export async function update(db: Db, id: number, input: PartialInput<SeasonInput>) {
  const [row] = await db.update(seasons).set(input).where(eq(seasons.id, id)).returning();
  return found(row, `Season ${id}`);
}

export async function remove(db: Db, id: number) {
  const [row] = await db.delete(seasons).where(eq(seasons.id, id)).returning({ id: seasons.id });
  found(row, `Season ${id}`);
  await db.delete(records).where(eq(records.seasonId, id));
  return { id };
}

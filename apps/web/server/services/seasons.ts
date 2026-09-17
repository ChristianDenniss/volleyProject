import { and, asc, desc, eq, isNotNull, isNull, or, sql } from "drizzle-orm";
import type { Db } from "@db";
import { awards, games, records, seasons, teams, teamsGames } from "@db/schema";
import { found } from "./errors";
import type { GameRegion } from "./games";
import type { PartialInput } from "./input";
import { cachedSiteRead } from "./site-read-cache";

export interface SeasonInput {
  seasonNumber: number;
  startDate: string;
  endDate?: string | null | undefined;
  image?: string | null | undefined;
  theme?: string | null | undefined;
}

const seasonMeta = {
  id: seasons.id,
  seasonNumber: seasons.seasonNumber,
  startDate: seasons.startDate,
  endDate: seasons.endDate,
  image: seasons.image,
  theme: seasons.theme,
};

export async function listMeta(db: Db) {
  return cachedSiteRead("seasons-meta", [], () =>
    db.select(seasonMeta).from(seasons).orderBy(desc(seasons.seasonNumber)),
  );
}

export async function latest(db: Db) {
  return cachedSiteRead("seasons-latest", [], async () => {
    const [open] = await db
      .select()
      .from(seasons)
      .where(isNull(seasons.endDate))
      .orderBy(desc(seasons.seasonNumber))
      .limit(1);
    if (open) return open;
    const [row] = await db.select().from(seasons).orderBy(desc(seasons.seasonNumber)).limit(1);
    return row ?? null;
  });
}

export async function list(db: Db, region?: GameRegion) {
  return cachedSiteRead("seasons-list-v2", [region], async () => {
    const rows = await db.select(seasonMeta).from(seasons).orderBy(desc(seasons.seasonNumber));
    if (rows.length === 0) return [];

    if (region) {
      const counts = await db
        .select({
          seasonId: games.seasonId,
          gameCount: sql<number>`count(distinct ${games.id})`,
          teamCount: sql<number>`count(distinct ${teamsGames.teamId})`,
        })
        .from(games)
        .leftJoin(teamsGames, eq(teamsGames.gameId, games.id))
        .where(eq(games.region, region))
        .groupBy(games.seasonId);
      const bySeason = new Map(counts.map((row) => [row.seasonId, row]));
      return rows.map((row) => ({
        ...row,
        teamCount: Number(bySeason.get(row.id)?.teamCount ?? 0),
        gameCount: Number(bySeason.get(row.id)?.gameCount ?? 0),
      }));
    }

    const [teamCounts, gameCounts, regionalCounts] = await Promise.all([
      db
        .select({
          seasonId: teams.seasonId,
          teamCount: sql<number>`count(*)`,
        })
        .from(teams)
        .groupBy(teams.seasonId),
      db
        .select({
          seasonId: games.seasonId,
          gameCount: sql<number>`count(*)`,
        })
        .from(games)
        .groupBy(games.seasonId),
      db
        .select({
          seasonId: games.seasonId,
          region: games.region,
          gameCount: sql<number>`count(distinct ${games.id})`,
          teamCount: sql<number>`count(distinct ${teamsGames.teamId})`,
        })
        .from(games)
        .leftJoin(teamsGames, eq(teamsGames.gameId, games.id))
        .groupBy(games.seasonId, games.region),
    ]);
    const teamsBySeason = new Map(teamCounts.map((row) => [row.seasonId, Number(row.teamCount)]));
    const gamesBySeason = new Map(gameCounts.map((row) => [row.seasonId, Number(row.gameCount)]));
    const regionStatsBySeason = new Map<number, Record<string, { teamCount: number; gameCount: number }>>();
    for (const row of regionalCounts) {
      if (row.seasonId == null) continue;
      const current = regionStatsBySeason.get(row.seasonId) ?? {};
      current[row.region] = {
        teamCount: Number(row.teamCount ?? 0),
        gameCount: Number(row.gameCount ?? 0),
      };
      regionStatsBySeason.set(row.seasonId, current);
    }
    return rows.map((row) => ({
      ...row,
      teamCount: teamsBySeason.get(row.id) ?? 0,
      gameCount: gamesBySeason.get(row.id) ?? 0,
      regionStats: regionStatsBySeason.get(row.id) ?? {},
    }));
  });
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
              sql`exists (
                select 1 from ${teamsGames}
                inner join ${games} on ${teamsGames.gameId} = ${games.id}
                where ${teamsGames.teamId} = ${teams.id}
                  and ${games.seasonId} = ${id}
                  and ${games.region} = ${region}
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

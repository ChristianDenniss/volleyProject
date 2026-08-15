import { asc, desc, eq, inArray, sql } from "drizzle-orm";
import type { Db } from "@db";
import { insertMany } from "@db/insert";
import { games, players, seasons, stats, teams, teamsGames } from "@db/schema";
import { BadRequestError, found, NotFoundError } from "./errors";

export interface GameInput {
  name?: string | null;
  date: string;
  seasonId: number;
  teamIds: number[];
  team1Score: number;
  team2Score: number;
  stage?: string;
  videoUrl?: string | null;
}

const listColumns = {
  id: games.id,
  name: games.name,
  date: games.date,
  stage: games.stage,
  videoUrl: games.videoUrl,
  team1Score: games.team1Score,
  team2Score: games.team2Score,
  seasonId: games.seasonId,
  seasonNumber: seasons.seasonNumber,
};

export async function list(db: Db) {
  const rows = await db
    .select(listColumns)
    .from(games)
    .leftJoin(seasons, eq(games.seasonId, seasons.id))
    .orderBy(desc(games.date));
  return attachTeams(db, rows);
}

export async function listBySeason(db: Db, seasonId: number) {
  const rows = await db
    .select(listColumns)
    .from(games)
    .leftJoin(seasons, eq(games.seasonId, seasons.id))
    .where(eq(games.seasonId, seasonId))
    .orderBy(asc(games.date));
  return attachTeams(db, rows);
}

export async function listByTeam(db: Db, teamId: number) {
  const rows = await db
    .select(listColumns)
    .from(teamsGames)
    .innerJoin(games, eq(teamsGames.gameId, games.id))
    .leftJoin(seasons, eq(games.seasonId, seasons.id))
    .where(eq(teamsGames.teamId, teamId))
    .orderBy(asc(games.date));
  return attachTeams(db, rows);
}

async function attachTeams<T extends { id: number }>(db: Db, rows: T[]) {
  if (rows.length === 0) return rows.map((row) => ({ ...row, teams: [] as TeamRef[] }));

  const links = await db
    .select({
      gameId: teamsGames.gameId,
      id: teams.id,
      name: teams.name,
      logoUrl: teams.logoUrl,
    })
    .from(teamsGames)
    .innerJoin(teams, eq(teamsGames.teamId, teams.id))
    .where(
      inArray(
        teamsGames.gameId,
        rows.map((row) => row.id),
      ),
    );

  const byGame = new Map<number, TeamRef[]>();
  for (const link of links) {
    const bucket = byGame.get(link.gameId) ?? [];
    bucket.push({ id: link.id, name: link.name, logoUrl: link.logoUrl });
    byGame.set(link.gameId, bucket);
  }

  return rows.map((row) => ({ ...row, teams: byGame.get(row.id) ?? [] }));
}

interface TeamRef {
  id: number;
  name: string;
  logoUrl: string | null;
}

export async function getById(db: Db, id: number) {
  const game = await db.query.games.findFirst({ where: eq(games.id, id) });
  if (!game) return null;

  const [gameTeams, gameStats, season] = await Promise.all([
    db
      .select({ id: teams.id, name: teams.name, logoUrl: teams.logoUrl, placement: teams.placement })
      .from(teamsGames)
      .innerJoin(teams, eq(teamsGames.teamId, teams.id))
      .where(eq(teamsGames.gameId, id)),
    db
      .select({
        id: stats.id,
        playerId: stats.playerId,
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
      })
      .from(stats)
      .innerJoin(players, eq(stats.playerId, players.id))
      .where(eq(stats.gameId, id))
      .orderBy(asc(players.name)),
    game.seasonId
      ? db.query.seasons.findFirst({ where: eq(seasons.id, game.seasonId) })
      : Promise.resolve(undefined),
  ]);

  return { ...game, teams: gameTeams, stats: gameStats, season: season ?? null };
}

export async function getScore(db: Db, id: number) {
  const row = await db
    .select({ team1Score: games.team1Score, team2Score: games.team2Score })
    .from(games)
    .where(eq(games.id, id))
    .get();
  return row ?? null;
}

export async function count(db: Db) {
  return db.$count(games);
}

async function assertSeason(db: Db, seasonId: number) {
  const season = await db.query.seasons.findFirst({ where: eq(seasons.id, seasonId) });
  if (!season) throw new NotFoundError(`Season ${seasonId}`);
  return season;
}

export async function create(db: Db, input: GameInput) {
  if (input.team1Score < 0 || input.team2Score < 0) {
    throw new BadRequestError("Scores cannot be negative");
  }
  await assertSeason(db, input.seasonId);

  const linked = await db.select().from(teams).where(inArray(teams.id, input.teamIds));
  if (linked.length !== input.teamIds.length) {
    const missing = input.teamIds.filter((id) => !linked.some((team) => team.id === id));
    throw new NotFoundError(`Teams ${missing.join(", ")}`);
  }

  const name = input.name ?? `${linked.map((team) => team.name).join(" Vs. ")}`;
  const [row] = await db
    .insert(games)
    .values({
      name,
      date: input.date,
      seasonId: input.seasonId,
      team1Score: input.team1Score,
      team2Score: input.team2Score,
      stage: input.stage,
      videoUrl: input.videoUrl ?? null,
    })
    .returning();

  await insertMany(
    db,
    teamsGames,
    input.teamIds.map((teamId) => ({ teamId, gameId: row.id })),
  );

  return row;
}

export async function createMany(db: Db, input: GameInput[]) {
  const created = [];
  for (const game of input) created.push(await create(db, game));
  return created;
}

export async function createByNames(
  db: Db,
  input: Omit<GameInput, "teamIds"> & { teamNames: string[] },
) {
  const linked = await db.select().from(teams).where(inArray(teams.name, input.teamNames));
  if (linked.length !== input.teamNames.length) {
    const missing = input.teamNames.filter((name) => !linked.some((team) => team.name === name));
    throw new NotFoundError(`Teams ${missing.join(", ")}`);
  }
  return create(db, { ...input, teamIds: linked.map((team) => team.id) });
}

export async function update(db: Db, id: number, input: Partial<Omit<GameInput, "teamIds">> & { teamIds?: number[] }) {
  const { teamIds, ...rest } = input;
  const [row] = await db.update(games).set(rest).where(eq(games.id, id)).returning();
  found(row, `Game ${id}`);

  if (teamIds) {
    await db.delete(teamsGames).where(eq(teamsGames.gameId, id));
    await insertMany(
      db,
      teamsGames,
      teamIds.map((teamId) => ({ teamId, gameId: id })),
    );
  }

  return row;
}

export async function remove(db: Db, id: number) {
  const [row] = await db.delete(games).where(eq(games.id, id)).returning({ id: games.id });
  found(row, `Game ${id}`);
  return { id };
}

export async function countBySeason(db: Db) {
  return db
    .select({ seasonId: games.seasonId, total: sql<number>`count(*)` })
    .from(games)
    .groupBy(games.seasonId);
}

import { and, asc, desc, eq, inArray, or, sql } from "drizzle-orm";
import type { Db } from "@db";
import { insertMany } from "@db/insert";
import {
  gameStaff,
  games,
  players,
  seasons,
  stats,
  teams,
  teamsGames,
  user,
  type ContributionRole,
} from "@db/schema";
import { BadRequestError, found, inserted, NotFoundError } from "./errors";
import type { PartialInput } from "./input";

export interface GameStaffMember {
  id: string;
  name: string;
  email: string;
}

export interface GameStaffSlots {
  streamed: GameStaffMember | null;
  reffed: GameStaffMember | null;
  commentated: GameStaffMember | null;
}

export interface GameInput {
  name?: string | null | undefined;
  date: string;
  seasonId: number;
  teamIds: number[];
  team1Score: number;
  team2Score: number;
  stage?: string | undefined;
  videoUrl?: string | null | undefined;
  streamer?: string | null | undefined;
  referee?: string | null | undefined;
  commentator?: string | null | undefined;
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
  if (rows.length === 0) {
    return attachStaff(
      db,
      rows.map((row) => ({ ...row, teams: [] as TeamRef[] })),
    );
  }

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

  const withTeams = rows.map((row) => ({ ...row, teams: byGame.get(row.id) ?? [] }));
  return attachStaff(db, withTeams);
}

function emptyStaff(): GameStaffSlots {
  return { streamed: null, reffed: null, commentated: null };
}

async function attachStaff<T extends { id: number }>(db: Db, rows: T[]) {
  if (rows.length === 0) return rows.map((row) => ({ ...row, staff: emptyStaff() }));

  const links = await db
    .select({
      gameId: gameStaff.gameId,
      role: gameStaff.role,
      id: user.id,
      name: user.name,
      email: user.email,
    })
    .from(gameStaff)
    .innerJoin(user, eq(gameStaff.userId, user.id))
    .where(
      inArray(
        gameStaff.gameId,
        rows.map((row) => row.id),
      ),
    );

  const byGame = new Map<number, GameStaffSlots>();
  for (const link of links) {
    const bucket = byGame.get(link.gameId) ?? emptyStaff();
    bucket[link.role] = { id: link.id, name: link.name, email: link.email };
    byGame.set(link.gameId, bucket);
  }

  return rows.map((row) => ({ ...row, staff: byGame.get(row.id) ?? emptyStaff() }));
}

async function findUserByHandle(db: Db, handle: string) {
  const row = await db
    .select({ id: user.id, name: user.name, email: user.email })
    .from(user)
    .where(or(eq(user.email, handle), eq(user.name, handle)))
    .get();
  return row ?? null;
}

async function setStaffRole(
  db: Db,
  gameId: number,
  role: ContributionRole,
  handle: string | null | undefined,
) {
  if (handle === undefined) return;
  await db.delete(gameStaff).where(and(eq(gameStaff.gameId, gameId), eq(gameStaff.role, role)));
  if (!handle) return;

  const person = await findUserByHandle(db, handle);
  if (!person) throw new NotFoundError(`User ${handle}`);
  await db.insert(gameStaff).values({ gameId, userId: person.id, role });
}

async function syncStaff(
  db: Db,
  gameId: number,
  staff: Pick<GameInput, "streamer" | "referee" | "commentator">,
) {
  await setStaffRole(db, gameId, "streamed", staff.streamer);
  await setStaffRole(db, gameId, "reffed", staff.referee);
  await setStaffRole(db, gameId, "commentated", staff.commentator);
}

interface TeamRef {
  id: number;
  name: string;
  logoUrl: string | null;
}

export async function getById(db: Db, id: number) {
  const game = await db.query.games.findFirst({ where: eq(games.id, id) });
  if (!game) return null;

  const [gameTeams, gameStats, season, [withStaff]] = await Promise.all([
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
    attachStaff(db, [{ id }]),
  ]);

  return {
    ...game,
    teams: gameTeams,
    stats: gameStats,
    season: season ?? null,
    staff: withStaff?.staff ?? emptyStaff(),
  };
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
  const [created] = await db
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

  const row = inserted(created, "Game");
  await insertMany(
    db,
    teamsGames,
    input.teamIds.map((teamId) => ({ teamId, gameId: row.id })),
  );
  await syncStaff(db, row.id, input);

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

export async function update(db: Db, id: number, input: PartialInput<Omit<GameInput, "teamIds">> & { teamIds?: number[] | undefined }) {
  const { teamIds, streamer, referee, commentator, ...rest } = input;
  const existing = await db.query.games.findFirst({ where: eq(games.id, id) });
  found(existing, `Game ${id}`);

  const [row] =
    Object.keys(rest).length > 0
      ? await db.update(games).set(rest).where(eq(games.id, id)).returning()
      : [existing];

  if (teamIds) {
    await db.delete(teamsGames).where(eq(teamsGames.gameId, id));
    await insertMany(
      db,
      teamsGames,
      teamIds.map((teamId) => ({ teamId, gameId: id })),
    );
  }
  await syncStaff(db, id, { streamer, referee, commentator });

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

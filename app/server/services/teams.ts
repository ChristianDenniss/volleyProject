import { and, asc, eq, inArray, sql } from "drizzle-orm";
import type { Db } from "@db";
import { correlatedCount } from "@db/sqlx";
import { insertMany } from "@db/insert";
import { games, players, seasons, teams, teamsGames, teamsPlayers } from "@db/schema";
import { ConflictError, found } from "./errors";

export interface TeamInput {
  name: string;
  logoUrl?: string | null;
  placement?: string;
  seasonId?: number | null;
}

const withSeason = {
  id: teams.id,
  name: teams.name,
  logoUrl: teams.logoUrl,
  placement: teams.placement,
  seasonId: teams.seasonId,
  seasonNumber: seasons.seasonNumber,
  playerCount: correlatedCount("teams_players", "team_id", "teams", "id"),
  gameCount: correlatedCount("teams_games", "team_id", "teams", "id"),
};

export async function list(db: Db) {
  return db
    .select(withSeason)
    .from(teams)
    .leftJoin(seasons, eq(teams.seasonId, seasons.id))
    .orderBy(asc(teams.name));
}

export async function listBySeason(db: Db, seasonId: number) {
  return db
    .select(withSeason)
    .from(teams)
    .leftJoin(seasons, eq(teams.seasonId, seasons.id))
    .where(eq(teams.seasonId, seasonId))
    .orderBy(asc(teams.name));
}

export async function getById(db: Db, id: number) {
  const team = await db.query.teams.findFirst({ where: eq(teams.id, id) });
  if (!team) return null;
  return hydrate(db, team);
}

export async function getByName(db: Db, name: string) {
  const team = await db.query.teams.findFirst({ where: eq(teams.name, name) });
  if (!team) return null;
  return hydrate(db, team);
}

async function hydrate(db: Db, team: typeof teams.$inferSelect) {
  const [roster, schedule, season] = await Promise.all([
    listPlayers(db, team.id),
    listGames(db, team.id),
    team.seasonId
      ? db.query.seasons.findFirst({ where: eq(seasons.id, team.seasonId) })
      : Promise.resolve(undefined),
  ]);
  return { ...team, players: roster, games: schedule, season: season ?? null };
}

export async function listPlayers(db: Db, teamId: number) {
  return db
    .select({
      id: players.id,
      name: players.name,
      position: players.position,
    })
    .from(teamsPlayers)
    .innerJoin(players, eq(teamsPlayers.playerId, players.id))
    .where(eq(teamsPlayers.teamId, teamId))
    .orderBy(asc(players.name));
}

export async function listPlayersBySeason(db: Db, seasonId: number) {
  return db
    .select({
      teamId: teamsPlayers.teamId,
      id: players.id,
      name: players.name,
      position: players.position,
    })
    .from(teamsPlayers)
    .innerJoin(players, eq(teamsPlayers.playerId, players.id))
    .innerJoin(teams, eq(teamsPlayers.teamId, teams.id))
    .where(eq(teams.seasonId, seasonId))
    .orderBy(asc(players.name));
}

export async function listPlayersByTeamName(db: Db, name: string) {
  const team = await db.query.teams.findFirst({ where: eq(teams.name, name) });
  if (!team) return null;
  return listPlayers(db, team.id);
}

export async function listGames(db: Db, teamId: number) {
  return db
    .select({
      id: games.id,
      name: games.name,
      date: games.date,
      stage: games.stage,
      team1Score: games.team1Score,
      team2Score: games.team2Score,
      seasonId: games.seasonId,
    })
    .from(teamsGames)
    .innerJoin(games, eq(teamsGames.gameId, games.id))
    .where(eq(teamsGames.teamId, teamId))
    .orderBy(asc(games.date));
}

export async function count(db: Db) {
  return db.$count(teams);
}

export async function create(db: Db, input: TeamInput) {
  const existing = await db.query.teams.findFirst({
    where: and(
      eq(teams.name, input.name),
      input.seasonId === undefined || input.seasonId === null
        ? sql`${teams.seasonId} is null`
        : eq(teams.seasonId, input.seasonId),
    ),
  });
  if (existing) throw new ConflictError(`Team "${input.name}" already exists in that season`);

  const [row] = await db.insert(teams).values(input).returning();
  return row;
}

export async function createMany(db: Db, input: TeamInput[]) {
  await insertMany(db, teams, input);
  const names = input.map((team) => team.name);
  return db.select().from(teams).where(inArray(teams.name, names));
}

export async function update(db: Db, id: number, input: Partial<TeamInput>) {
  const [row] = await db.update(teams).set(input).where(eq(teams.id, id)).returning();
  return found(row, `Team ${id}`);
}

export async function remove(db: Db, id: number) {
  const [row] = await db.delete(teams).where(eq(teams.id, id)).returning({ id: teams.id });
  found(row, `Team ${id}`);
  return { id };
}

export async function setPlayers(db: Db, teamId: number, playerIds: number[]) {
  await db.delete(teamsPlayers).where(eq(teamsPlayers.teamId, teamId));
  await insertMany(
    db,
    teamsPlayers,
    playerIds.map((playerId) => ({ teamId, playerId })),
  );
  return listPlayers(db, teamId);
}

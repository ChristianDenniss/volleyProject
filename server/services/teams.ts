import { and, asc, eq, inArray, sql } from "drizzle-orm";
import type { Db } from "@db";
import { correlatedCount } from "@db/sqlx";
import { insertMany } from "@db/insert";
import {
  games,
  players,
  seasons,
  teams,
  teamsGames,
  teamsPlayers,
  TEAM_LEADERSHIP_ROLES,
  type TeamLeadershipRole,
} from "@db/schema";
import { ConflictError, found } from "./errors";
import type { PartialInput } from "./input";
import { isAdmin } from "./users";

export type { TeamLeadershipRole };
export { TEAM_LEADERSHIP_ROLES };

export interface TeamInput {
  name: string;
  logoUrl?: string | null | undefined;
  description?: string | null | undefined;
  placement?: string | undefined;
  seasonId?: number | null | undefined;
}

export interface TeamProfileInput {
  logoUrl?: string | null | undefined;
  description?: string | null | undefined;
}

const ROLE_ORDER = Object.fromEntries(
  TEAM_LEADERSHIP_ROLES.map((role, index) => [role, index]),
) as Record<TeamLeadershipRole, number>;

const withSeason = {
  id: teams.id,
  name: teams.name,
  logoUrl: teams.logoUrl,
  description: teams.description,
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

function sortRoster<T extends { name: string; role: TeamLeadershipRole | null }>(rows: T[]): T[] {
  return [...rows].sort((left, right) => {
    const leftRank = left.role != null ? (ROLE_ORDER[left.role] ?? 99) : 99;
    const rightRank = right.role != null ? (ROLE_ORDER[right.role] ?? 99) : 99;
    if (leftRank !== rightRank) return leftRank - rightRank;
    return left.name.localeCompare(right.name);
  });
}

export async function listPlayers(db: Db, teamId: number) {
  const rows = await db
    .select({
      id: players.id,
      name: players.name,
      position: players.position,
      role: teamsPlayers.role,
    })
    .from(teamsPlayers)
    .innerJoin(players, eq(teamsPlayers.playerId, players.id))
    .where(eq(teamsPlayers.teamId, teamId));
  return sortRoster(rows);
}

export async function listPlayersBySeason(db: Db, seasonId: number) {
  const rows = await db
    .select({
      teamId: teamsPlayers.teamId,
      id: players.id,
      name: players.name,
      position: players.position,
      role: teamsPlayers.role,
    })
    .from(teamsPlayers)
    .innerJoin(players, eq(teamsPlayers.playerId, players.id))
    .innerJoin(teams, eq(teamsPlayers.teamId, teams.id))
    .where(eq(teams.seasonId, seasonId));
  return sortRoster(rows);
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

export async function update(db: Db, id: number, input: PartialInput<TeamInput>) {
  const [row] = await db.update(teams).set(input).where(eq(teams.id, id)).returning();
  return found(row, `Team ${id}`);
}

export async function updateProfile(db: Db, id: number, input: TeamProfileInput) {
  const [row] = await db
    .update(teams)
    .set({
      ...(input.logoUrl !== undefined ? { logoUrl: input.logoUrl } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
    })
    .where(eq(teams.id, id))
    .returning();
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

/** True when the user is an admin or a C / VC / CC on this roster. */
export async function canManageProfile(
  db: Db,
  teamId: number,
  user: { id: string; role: string } | null | undefined,
): Promise<boolean> {
  if (!user) return false;
  if (isAdmin(user.role)) return true;

  const linked = await db.query.players.findFirst({ where: eq(players.userId, user.id) });
  if (!linked) return false;

  const seat = await db.query.teamsPlayers.findFirst({
    where: and(eq(teamsPlayers.teamId, teamId), eq(teamsPlayers.playerId, linked.id)),
  });
  return seat?.role != null && TEAM_LEADERSHIP_ROLES.includes(seat.role);
}

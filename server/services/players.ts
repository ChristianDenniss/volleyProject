import { and, asc, eq, inArray, sql } from "drizzle-orm";
import type { Db } from "@db";
import { correlatedCount } from "@db/sqlx";
import { insertMany } from "@db/insert";
import {
  account,
  awards,
  awardsPlayers,
  games,
  players,
  records,
  seasons,
  stats,
  teams,
  teamsPlayers,
  user,
} from "@db/schema";
import { ConflictError, found, inserted, NotFoundError } from "./errors";
import type { PartialInput } from "./input";

export interface PlayerInput {
  name: string;
  position?: string | undefined;
}

const teamCount = correlatedCount("teams_players", "player_id", "players", "id");
const gamesPlayed = correlatedCount("stats", "player_id", "players", "id");

export async function list(db: Db) {
  return db
    .select({
      id: players.id,
      name: players.name,
      position: players.position,
      teamCount,
      gamesPlayed,
    })
    .from(players)
    .orderBy(asc(players.name));
}

export async function listByTeam(db: Db, teamId: number) {
  return db
    .select({ id: players.id, name: players.name, position: players.position })
    .from(teamsPlayers)
    .innerJoin(players, eq(teamsPlayers.playerId, players.id))
    .where(eq(teamsPlayers.teamId, teamId))
    .orderBy(asc(players.name));
}

export async function getById(db: Db, id: number) {
  const player = await db.query.players.findFirst({ where: eq(players.id, id) });
  if (!player) return null;

  const [playerTeams, playerStats, playerAwards, playerRecords] = await Promise.all([
    listTeams(db, id),
    db
      .select({
        id: stats.id,
        gameId: stats.gameId,
        gameName: games.name,
        gameDate: games.date,
        seasonId: games.seasonId,
        seasonNumber: seasons.seasonNumber,
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
      .innerJoin(games, eq(stats.gameId, games.id))
      .leftJoin(seasons, eq(games.seasonId, seasons.id))
      .where(eq(stats.playerId, id))
      .orderBy(asc(games.date)),
    db
      .select({
        id: awards.id,
        type: awards.type,
        description: awards.description,
        imageUrl: awards.imageUrl,
        seasonId: awards.seasonId,
        seasonNumber: seasons.seasonNumber,
      })
      .from(awardsPlayers)
      .innerJoin(awards, eq(awardsPlayers.awardId, awards.id))
      .leftJoin(seasons, eq(awards.seasonId, seasons.id))
      .where(eq(awardsPlayers.playerId, id)),
    db.select().from(records).where(eq(records.playerId, id)),
  ]);

  return {
    ...player,
    teams: playerTeams,
    stats: playerStats,
    awards: playerAwards,
    records: playerRecords,
  };
}

export async function listTeams(db: Db, playerId: number) {
  return db
    .select({
      id: teams.id,
      name: teams.name,
      logoUrl: teams.logoUrl,
      placement: teams.placement,
      seasonId: teams.seasonId,
      seasonNumber: seasons.seasonNumber,
    })
    .from(teamsPlayers)
    .innerJoin(teams, eq(teamsPlayers.teamId, teams.id))
    .leftJoin(seasons, eq(teams.seasonId, seasons.id))
    .where(eq(teamsPlayers.playerId, playerId))
    .orderBy(asc(teams.name));
}

export async function listTeamNamesByPlayerName(db: Db, playerName: string) {
  const player = await db.query.players.findFirst({
    where: eq(players.name, playerName.toLowerCase()),
  });
  if (!player) return null;
  const rows = await listTeams(db, player.id);
  return rows.map((team) => team.name);
}

export async function listAllMemberships(db: Db) {
  return db
    .select({
      playerId: teamsPlayers.playerId,
      teamName: teams.name,
      seasonNumber: seasons.seasonNumber,
    })
    .from(teamsPlayers)
    .innerJoin(teams, eq(teamsPlayers.teamId, teams.id))
    .leftJoin(seasons, eq(teams.seasonId, seasons.id))
    .orderBy(asc(teams.name));
}

export async function count(db: Db) {
  return db.$count(players);
}

export async function create(db: Db, input: PlayerInput & { teamId?: number | null | undefined }) {
  const name = input.name.toLowerCase();
  const existing = await db.query.players.findFirst({ where: eq(players.name, name) });
  if (existing) throw new ConflictError(`Player "${input.name}" already exists`);

  const [created] = await db
    .insert(players)
    .values({ name, position: input.position ?? "N/A" })
    .returning();

  const row = inserted(created, "Player");
  if (input.teamId) await attachToTeam(db, row.id, input.teamId);
  return row;
}

export async function createByTeamName(db: Db, input: PlayerInput & { teamName: string }) {
  const team = await db.query.teams.findFirst({ where: eq(teams.name, input.teamName) });
  if (!team) throw new NotFoundError(`Team "${input.teamName}"`);
  return create(db, { name: input.name, position: input.position, teamId: team.id });
}

export async function createMany(db: Db, input: PlayerInput[]) {
  const rows = input.map((player) => ({
    name: player.name.toLowerCase(),
    position: player.position ?? "N/A",
  }));
  await insertMany(db, players, rows);
  return db.select().from(players).where(
    inArray(
      players.name,
      rows.map((row) => row.name),
    ),
  );
}

export async function createManyByTeamName(
  db: Db,
  input: { teamName: string; players: PlayerInput[] },
) {
  const team = await db.query.teams.findFirst({ where: eq(teams.name, input.teamName) });
  if (!team) throw new NotFoundError(`Team "${input.teamName}"`);

  const created = await createMany(db, input.players);
  await insertMany(
    db,
    teamsPlayers,
    created.map((player) => ({ teamId: team.id, playerId: player.id })),
  );
  return created;
}

async function attachToTeam(db: Db, playerId: number, teamId: number) {
  const team = await db.query.teams.findFirst({ where: eq(teams.id, teamId) });
  if (!team) throw new NotFoundError(`Team ${teamId}`);
  await db.insert(teamsPlayers).values({ teamId, playerId }).onConflictDoNothing();
}

export async function update(db: Db, id: number, input: PartialInput<PlayerInput>) {
  const values = input.name ? { ...input, name: input.name.toLowerCase() } : input;
  const [row] = await db.update(players).set(values).where(eq(players.id, id)).returning();
  return found(row, `Player ${id}`);
}

export async function remove(db: Db, id: number) {
  const [row] = await db.delete(players).where(eq(players.id, id)).returning({ id: players.id });
  found(row, `Player ${id}`);
  return { id };
}

export function usernameForUser(row: { name: string; email: string }): string {
  const email = row.email.trim();
  if (email.includes("@")) return row.name.trim().toLowerCase();
  return email.toLowerCase();
}

export async function ensureLinkedToUser(db: Db, userId: string) {
  const already = await db.query.players.findFirst({ where: eq(players.userId, userId) });
  if (already) return already;

  const roblox = await db.query.account.findFirst({
    where: and(eq(account.userId, userId), eq(account.providerId, "roblox")),
  });
  const robloxUserId = roblox?.accountId ?? null;

  if (robloxUserId) {
    const byRoblox = await db.query.players.findFirst({
      where: eq(players.robloxUserId, robloxUserId),
    });
    if (byRoblox && !byRoblox.userId) {
      const [updated] = await db
        .update(players)
        .set({ userId })
        .where(eq(players.id, byRoblox.id))
        .returning();
      return updated ?? byRoblox;
    }
    if (byRoblox?.userId === userId) return byRoblox;
  }

  const siteUser = await db.query.user.findFirst({ where: eq(user.id, userId) });
  if (!siteUser) return null;

  const username = usernameForUser(siteUser);
  if (!username) return null;

  const byName = await db.query.players.findFirst({
    where: sql`lower(${players.name}) = ${username}`,
  });

  if (byName) {
    if (byName.userId && byName.userId !== userId) return null;
    const [updated] = await db
      .update(players)
      .set({ userId, robloxUserId: byName.robloxUserId ?? robloxUserId })
      .where(eq(players.id, byName.id))
      .returning();
    return updated ?? byName;
  }

  const [created] = await db
    .insert(players)
    .values({ name: username, position: "N/A", userId, robloxUserId })
    .returning();
  return created ?? null;
}

export async function merge(db: Db, targetId: number, mergedId: number) {
  const target = await db.query.players.findFirst({ where: eq(players.id, targetId) });
  if (!target) throw new NotFoundError(`Target player ${targetId}`);
  const merged = await db.query.players.findFirst({ where: eq(players.id, mergedId) });
  if (!merged) throw new NotFoundError(`Player to merge ${mergedId}`);

  if (merged.userId || merged.robloxUserId) {
    await db
      .update(players)
      .set({ userId: null, robloxUserId: null })
      .where(eq(players.id, mergedId));
    await db
      .update(players)
      .set({
        userId: target.userId ?? merged.userId,
        robloxUserId: target.robloxUserId ?? merged.robloxUserId,
      })
      .where(eq(players.id, targetId));
  }

  const [mergedTeams, mergedAwards] = await Promise.all([
    db
      .select({ teamId: teamsPlayers.teamId })
      .from(teamsPlayers)
      .where(eq(teamsPlayers.playerId, mergedId)),
    db
      .select({ awardId: awardsPlayers.awardId })
      .from(awardsPlayers)
      .where(eq(awardsPlayers.playerId, mergedId)),
  ]);

  for (const row of mergedTeams) {
    await db
      .insert(teamsPlayers)
      .values({ teamId: row.teamId, playerId: targetId })
      .onConflictDoNothing();
  }

  for (const row of mergedAwards) {
    await db
      .insert(awardsPlayers)
      .values({ awardId: row.awardId, playerId: targetId })
      .onConflictDoNothing();
  }

  await db
    .update(stats)
    .set({ playerId: targetId })
    .where(
      and(
        eq(stats.playerId, mergedId),
        sql`${stats.gameId} not in (select "game_id" from ${stats} where ${stats.playerId} = ${targetId})`,
      ),
    );

  await db.update(records).set({ playerId: targetId }).where(eq(records.playerId, mergedId));
  await db.delete(players).where(eq(players.id, mergedId));

  return { id: targetId };
}

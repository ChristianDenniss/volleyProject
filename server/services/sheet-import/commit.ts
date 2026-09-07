import { and, eq, inArray, sql } from "drizzle-orm";
import type { Db } from "@db";
import {
  chunkIds,
  chunkValues,
  insertManyIgnore,
  insertManyReturning,
  insertStatsIgnoreBatch,
  runD1Batch,
  type StatInsertRow,
} from "@db/insert";
import { games, players, seasons, stats, teams, teamsGames, teamsPlayers } from "@db/schema";
import type { TeamLeadershipRole } from "@db/schema";
import { BadRequestError, NotFoundError } from "../errors";
import type { RecordsJobMessage } from "../../queue";
import { assembleSheetImportPreview, buildSheetImportPreview, assertPreviewCommitable } from "./preview";
import { deleteSheetImportSession, requireSheetImportSession } from "./session";
import type { FetchImpl } from "./fetch";
import { importKeyFromStoredGame } from "./keys";
import { teamMatchKey } from "./names";
import type {
  PreviewGame,
  PreviewTeam,
  SheetImportCommitResult,
  SheetImportInput,
  SheetImportPreview,
} from "./types";
import type { SheetRegion } from "./types";

interface StoredGameTeams {
  region: SheetRegion;
  phase: string;
  round: string;
  date: string;
  team1Score: number | null;
  team2Score: number | null;
  team1Name?: string;
  team2Name?: string;
}

type RosterLink = { teamId: number; playerId: number };
type RoleAssignment = { teamId: number; playerId: number; role: TeamLeadershipRole };
type GameTeamLink = { gameId: number; teamId: number; slot: 1 | 2 };

const ROLE_UPDATE_SQL =
  "UPDATE teams_players SET role = ? WHERE team_id = ? AND player_id = ?";

function rosterKey(link: RosterLink): string {
  return `${link.teamId}:${link.playerId}`;
}

function dedupeRosterLinks(links: RosterLink[]): RosterLink[] {
  const seen = new Set<string>();
  const unique: RosterLink[] = [];
  for (const link of links) {
    const key = rosterKey(link);
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(link);
  }
  return unique;
}

function collectPlayerNames(activeTeams: PreviewTeam[], preview: SheetImportPreview): string[] {
  const names = new Set<string>();
  for (const team of activeTeams) {
    for (const playerName of team.playerNames) names.add(playerName);
    if (team.leadership) {
      for (const role of ["C", "VC", "CC"] as const) {
        const captain = team.leadership[role];
        if (captain) names.add(captain);
      }
    }
  }
  for (const row of preview.stats) names.add(row.playerName);
  return [...names];
}

async function loadExistingGameIdByKey(db: Db, seasonId: number): Promise<Map<string, number>> {
  const rows = await db
    .select({
      gameId: games.id,
      region: games.region,
      phase: games.phase,
      round: games.round,
      date: games.date,
      team1Score: games.team1Score,
      team2Score: games.team2Score,
      slot: teamsGames.slot,
      teamName: teams.name,
    })
    .from(games)
    .innerJoin(teamsGames, eq(teamsGames.gameId, games.id))
    .innerJoin(teams, eq(teams.id, teamsGames.teamId))
    .where(eq(games.seasonId, seasonId));

  const grouped = new Map<number, StoredGameTeams>();
  for (const row of rows) {
    let entry = grouped.get(row.gameId);
    if (!entry) {
      entry = {
        region: row.region as SheetRegion,
        phase: row.phase,
        round: row.round ?? "",
        date: row.date,
        team1Score: row.team1Score,
        team2Score: row.team2Score,
      };
      grouped.set(row.gameId, entry);
    }
    if (row.slot === 1) entry.team1Name = row.teamName;
    if (row.slot === 2) entry.team2Name = row.teamName;
  }

  const byKey = new Map<string, number>();
  for (const [gameId, entry] of grouped) {
    if (!entry.team1Name || !entry.team2Name) continue;
    const key = importKeyFromStoredGame({
      region: entry.region,
      phase: entry.phase,
      round: entry.round,
      date: entry.date,
      team1Name: entry.team1Name,
      team2Name: entry.team2Name,
      team1Score: entry.team1Score,
      team2Score: entry.team2Score,
    });
    byKey.set(key, gameId);
  }
  return byKey;
}

async function resolvePlayerIds(
  db: Db,
  names: string[],
): Promise<{ ids: Map<string, number>; created: number }> {
  const lowered = [...new Set(names.map((name) => name.toLowerCase()))];
  const ids = new Map<string, number>();
  if (lowered.length === 0) return { ids, created: 0 };

  for (const chunk of chunkValues(lowered)) {
    const rows = await db.select().from(players).where(inArray(players.name, chunk));
    for (const row of rows) ids.set(row.name, row.id);
  }

  const missing = lowered.filter((name) => !ids.has(name));
  if (missing.length > 0) {
    await insertManyIgnore(
      db,
      players,
      missing.map((name) => ({ name, position: "N/A" as const })),
    );
    for (const chunk of chunkValues(missing)) {
      const rows = await db.select().from(players).where(inArray(players.name, chunk));
      for (const row of rows) ids.set(row.name, row.id);
    }
  }

  return { ids, created: missing.length };
}

async function resolveTeamIds(
  db: Db,
  seasonId: number,
  names: string[],
  existing: Map<string, number>,
): Promise<number> {
  const missing = names.filter((name) => !existing.has(teamMatchKey(name)));
  if (missing.length === 0) return 0;

  await insertManyIgnore(
    db,
    teams,
    missing.map((name) => ({ name, seasonId, placement: "Didnt make playoffs" })),
  );

  for (const chunk of chunkValues(missing)) {
    const rows = await db
      .select()
      .from(teams)
      .where(and(eq(teams.seasonId, seasonId), inArray(teams.name, chunk)));
    for (const row of rows) existing.set(teamMatchKey(row.name), row.id);
  }

  return missing.length;
}

function applyPreviewExcludes(
  preview: SheetImportPreview,
  input: SheetImportInput,
): SheetImportPreview {
  const excludeTeams = new Set(input.excludeTeamKeys?.map((key) => key.toLowerCase()) ?? []);
  const excludeGames = new Set(input.excludeGameKeys?.map((key) => key.toLowerCase()) ?? []);
  if (excludeTeams.size === 0 && excludeGames.size === 0) return preview;

  const teams = preview.teams.map((team) => ({
    ...team,
    included: team.included && !excludeTeams.has(team.key.toLowerCase()),
  }));
  const games = preview.games.map((game) => ({
    ...game,
    included: game.included && !excludeGames.has(game.key.toLowerCase()),
  }));
  const activeGameKeys = new Set(games.filter((game) => game.included).map((game) => game.key));
  const stats = preview.stats.filter((stat) => activeGameKeys.has(stat.gameKey));

  return { ...preview, teams, games, stats };
}

function gameInsertRow(game: PreviewGame, seasonId: number) {
  const status = game.team1Score != null && game.team2Score != null ? "completed" : "scheduled";
  return {
    name: `${game.team1Name} Vs. ${game.team2Name}`,
    matchNumber: game.round,
    round: game.round,
    status: status as "completed" | "scheduled",
    phase: game.phase,
    region: game.region,
    date: game.date,
    seasonId,
    team1Score: game.team1Score,
    team2Score: game.team2Score,
    set1Score: game.setScores[0] ?? null,
    set2Score: game.setScores[1] ?? null,
    set3Score: game.setScores[2] ?? null,
    set4Score: game.setScores[3] ?? null,
    set5Score: game.setScores[4] ?? null,
    stage: game.phase === "playoffs" ? game.round : "Qualifiers",
  };
}

async function importGamesBatch(
  db: Db,
  seasonId: number,
  activeGames: PreviewGame[],
  teamIdByName: Map<string, number>,
  gameIdByKey: Map<string, number>,
  warnings: string[],
): Promise<{ gamesCreated: number; teamGameLinks: GameTeamLink[] }> {
  const gamesToInsert: ReturnType<typeof gameInsertRow>[] = [];
  const pendingGames: { key: string; team1Id: number; team2Id: number }[] = [];
  const teamGameLinks: GameTeamLink[] = [];

  for (const game of activeGames) {
    const team1Id = teamIdByName.get(teamMatchKey(game.team1Name));
    const team2Id = teamIdByName.get(teamMatchKey(game.team2Name));
    if (!team1Id || !team2Id) {
      warnings.push(`Skipped game ${game.team1Name} vs ${game.team2Name} (missing team ids)`);
      continue;
    }

    const existingGameId = gameIdByKey.get(game.key);
    if (existingGameId != null) {
      teamGameLinks.push(
        { gameId: existingGameId, teamId: team1Id, slot: 1 },
        { gameId: existingGameId, teamId: team2Id, slot: 2 },
      );
      continue;
    }

    gamesToInsert.push(gameInsertRow(game, seasonId));
    pendingGames.push({ key: game.key, team1Id, team2Id });
  }

  let gamesCreated = 0;
  if (gamesToInsert.length > 0) {
    const created = await insertManyReturning(db, games, gamesToInsert);
    for (let index = 0; index < created.length; index += 1) {
      const row = created[index];
      const pending = pendingGames[index];
      if (!row || !pending) continue;

      gameIdByKey.set(pending.key, row.id);
      gamesCreated += 1;
      teamGameLinks.push(
        { gameId: row.id, teamId: pending.team1Id, slot: 1 },
        { gameId: row.id, teamId: pending.team2Id, slot: 2 },
      );
    }
  }

  return { gamesCreated, teamGameLinks };
}

async function attachRostersAndLeadership(
  db: Db,
  d1: D1Database | undefined,
  activeTeams: PreviewTeam[],
  teamIdByName: Map<string, number>,
  playerIdsByName: Map<string, number>,
  input: SheetImportInput,
  warnings: string[],
): Promise<number> {
  const rosterLinks: RosterLink[] = [];
  const roleAssignments: RoleAssignment[] = [];
  const teamIdsToClear = new Set<number>();

  for (const team of activeTeams) {
    const teamId = teamIdByName.get(teamMatchKey(team.name));
    if (!teamId) {
      if (input.mode === "players") {
        warnings.push(`Skipped players for missing team "${team.name}"`);
        continue;
      }
      throw new BadRequestError(`Team "${team.name}" was not created`);
    }

    const seenOnTeam = new Set<number>();
    for (const playerName of team.playerNames) {
      const playerId = playerIdsByName.get(playerName.toLowerCase());
      if (!playerId) {
        throw new BadRequestError(`Could not resolve player "${playerName}"`);
      }
      if (seenOnTeam.has(playerId)) continue;
      seenOnTeam.add(playerId);
      rosterLinks.push({ teamId, playerId });
    }

    if (team.leadership) {
      teamIdsToClear.add(teamId);
      for (const role of ["C", "VC", "CC"] as const) {
        const captain = team.leadership[role];
        if (!captain) continue;
        const playerId = playerIdsByName.get(captain.toLowerCase());
        if (!playerId) {
          warnings.push(
            `Could not assign ${role} on "${team.name}" — player "${captain}" missing from roster`,
          );
          continue;
        }
        if (!seenOnTeam.has(playerId)) {
          rosterLinks.push({ teamId, playerId });
          seenOnTeam.add(playerId);
        }
        roleAssignments.push({ teamId, playerId, role });
      }
    } else if (team.fromMaster && team.playerNames.length > 0) {
      warnings.push(
        `No captaincy (C/VC/CC) found for "${team.name}" — check the master TEAMS header row`,
      );
    }
  }

  const uniqueLinks = dedupeRosterLinks(rosterLinks);
  if (uniqueLinks.length > 0) {
    await insertManyIgnore(db, teamsPlayers, uniqueLinks);
  }

  if (teamIdsToClear.size > 0) {
    for (const chunk of chunkIds([...teamIdsToClear])) {
      await db
        .update(teamsPlayers)
        .set({ role: sql`NULL` })
        .where(and(inArray(teamsPlayers.teamId, chunk), sql`${teamsPlayers.role} is not null`));
    }
  }

  if (roleAssignments.length > 0 && d1) {
    await runD1Batch(
      d1,
      roleAssignments.map((assignment) =>
        d1.prepare(ROLE_UPDATE_SQL).bind(assignment.role, assignment.teamId, assignment.playerId),
      ),
    );
  } else {
    for (const assignment of roleAssignments) {
      await db
        .update(teamsPlayers)
        .set({ role: assignment.role })
        .where(
          and(
            eq(teamsPlayers.teamId, assignment.teamId),
            eq(teamsPlayers.playerId, assignment.playerId),
          ),
        );
    }
  }

  return uniqueLinks.length;
}

export async function commitSheetImport(
  db: Db,
  input: SheetImportInput,
  options: {
    fetchImpl?: FetchImpl;
    queue?: Queue<RecordsJobMessage> | null;
    requestedBy?: string | null;
    d1?: D1Database;
  } = {},
): Promise<SheetImportCommitResult> {
  const preview = input.preview
    ? applyPreviewExcludes(input.preview, input)
    : input.sources
      ? await assembleSheetImportPreview(db, input, input.sources)
      : input.sessionId
        ? await assembleSheetImportPreview(
            db,
            input,
            await requireSheetImportSession(input.sessionId),
          )
        : await buildSheetImportPreview(db, input, options.fetchImpl ?? fetch);
  assertPreviewCommitable(preview);

  const includePlayers =
    input.mode === "full" || input.mode === "teams_and_players" || input.mode === "players";
  const includeTeams =
    input.mode === "full" || input.mode === "teams" || input.mode === "teams_and_players";
  const includeGames = input.mode === "full";
  const includeStats = input.mode === "full";

  let seasonId = input.seasonId ?? preview.seasonId;
  let seasonNumber = preview.seasonNumber ?? input.seasonNumber ?? 0;

  if (input.mode === "full") {
    if (input.seasonNumber == null || !input.startDate) {
      throw new BadRequestError("Season number and start date are required");
    }
    const existing = await db.query.seasons.findFirst({
      where: eq(seasons.seasonNumber, input.seasonNumber),
    });
    if (existing) {
      seasonId = existing.id;
      seasonNumber = existing.seasonNumber;
    } else {
      const [created] = await db
        .insert(seasons)
        .values({
          seasonNumber: input.seasonNumber,
          startDate: input.startDate,
          endDate: input.endDate ?? null,
          theme: input.theme ?? null,
        })
        .returning();
      if (!created) throw new BadRequestError("Could not create season");
      seasonId = created.id;
      seasonNumber = created.seasonNumber;
    }
  } else {
    if (seasonId == null) throw new BadRequestError("Season is required");
    const season = await db.query.seasons.findFirst({ where: eq(seasons.id, seasonId) });
    if (!season) throw new NotFoundError(`Season ${seasonId}`);
    seasonNumber = season.seasonNumber;
  }

  if (seasonId == null) throw new BadRequestError("Season is required");

  let teamsCreated = 0;
  let playersCreated = 0;
  let playersAttached = 0;
  let gamesCreated = 0;
  let statsCreated = 0;

  const teamIdByName = new Map<string, number>();
  const existingTeams = await db.select().from(teams).where(eq(teams.seasonId, seasonId));
  for (const team of existingTeams) {
    teamIdByName.set(teamMatchKey(team.name), team.id);
  }

  const activeTeams = preview.teams.filter((team) => team.included);
  const activeGames = preview.games.filter((game) => game.included);

  if (includeTeams) {
    teamsCreated = await resolveTeamIds(
      db,
      seasonId,
      activeTeams.map((team) => team.name),
      teamIdByName,
    );
  }

  let playerIdsByName = new Map<string, number>();
  if (includePlayers || includeStats) {
    const resolved = await resolvePlayerIds(db, collectPlayerNames(activeTeams, preview));
    playerIdsByName = resolved.ids;
    playersCreated = resolved.created;
  }

  if (includePlayers) {
    playersAttached = await attachRostersAndLeadership(
      db,
      options.d1,
      activeTeams,
      teamIdByName,
      playerIdsByName,
      input,
      preview.warnings,
    );
  }

  const gameIdByKey = includeGames ? await loadExistingGameIdByKey(db, seasonId) : new Map<string, number>();

  if (includeGames) {
    const imported = await importGamesBatch(
      db,
      seasonId,
      activeGames,
      teamIdByName,
      gameIdByKey,
      preview.warnings,
    );
    gamesCreated = imported.gamesCreated;
    if (imported.teamGameLinks.length > 0) {
      await insertManyIgnore(db, teamsGames, imported.teamGameLinks);
    }
  }

  if (includeStats) {
    const statRows: StatInsertRow[] = [];
    const seenStatKeys = new Set<string>();
    const statRosterLinks: RosterLink[] = [];

    for (const row of preview.stats) {
      const gameId = gameIdByKey.get(row.gameKey);
      if (!gameId) continue;

      const playerId = playerIdsByName.get(row.playerName.toLowerCase());
      if (!playerId) continue;

      if (!includePlayers) {
        const teamId = teamIdByName.get(teamMatchKey(row.teamName));
        if (teamId) statRosterLinks.push({ teamId, playerId });
      }

      const statKey = `${playerId}:${gameId}`;
      if (seenStatKeys.has(statKey)) continue;
      seenStatKeys.add(statKey);

      statRows.push({
        playerId,
        gameId,
        ...row.counts,
      });
    }

    if (!includePlayers && statRosterLinks.length > 0) {
      await insertManyIgnore(db, teamsPlayers, dedupeRosterLinks(statRosterLinks));
    }

    if (statRows.length > 0) {
      if (options.d1) {
        await insertStatsIgnoreBatch(options.d1, statRows);
      } else {
        await insertManyIgnore(db, stats, statRows);
      }
      statsCreated = statRows.length;
    }
  }

  if (options.queue && input.mode === "full") {
    const { enqueueRecalculation } = await import("../../queue");
    await enqueueRecalculation(db, options.queue, {
      seasonId,
      requestedBy: options.requestedBy ?? null,
    });
  }

  if (input.sessionId) {
    await deleteSheetImportSession(input.sessionId);
  }

  return {
    seasonId,
    seasonNumber,
    teamsCreated,
    playersCreated,
    playersAttached,
    gamesCreated,
    statsCreated,
    warnings: preview.warnings,
  };
}

import { and, eq, inArray, sql } from "drizzle-orm";
import type { Db } from "@db";
import { insertMany, insertManyIgnore } from "@db/insert";
import { games, players, seasons, stats, teams, teamsGames, teamsPlayers } from "@db/schema";
import { BadRequestError, NotFoundError } from "../errors";
import type { RecordsJobMessage } from "../../queue";
import { assembleSheetImportPreview, buildSheetImportPreview, assertPreviewCommitable } from "./preview";
import type { FetchImpl } from "./fetch";
import { normalizeName } from "./names";
import type { SheetImportCommitResult, SheetImportInput } from "./types";

async function getOrCreatePlayer(db: Db, name: string): Promise<{ id: number; created: boolean }> {
  const lowered = name.toLowerCase();
  const existing = await db.query.players.findFirst({ where: eq(players.name, lowered) });
  if (existing) return { id: existing.id, created: false };
  const [created] = await db.insert(players).values({ name: lowered, position: "N/A" }).returning();
  if (!created) throw new BadRequestError(`Could not create player "${name}"`);
  return { id: created.id, created: true };
}

export async function commitSheetImport(
  db: Db,
  input: SheetImportInput,
  options: {
    fetchImpl?: FetchImpl;
    queue?: Queue<RecordsJobMessage> | null;
    requestedBy?: string | null;
  } = {},
): Promise<SheetImportCommitResult> {
  const preview = input.sources
    ? await assembleSheetImportPreview(db, input, input.sources)
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
      preview.warnings.push(
        `Season ${input.seasonNumber} already exists — resuming import into season ${seasonId}.`,
      );
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

  // Load existing season teams for players-only / merge
  const existingTeams = await db.select().from(teams).where(eq(teams.seasonId, seasonId));
  for (const team of existingTeams) {
    teamIdByName.set(normalizeName(team.name), team.id);
  }

  const activeTeams = preview.teams.filter((team) => team.included);

  if (includeTeams) {
    for (const team of activeTeams) {
      const key = normalizeName(team.name);
      if (teamIdByName.has(key)) continue;
      const [created] = await db
        .insert(teams)
        .values({ name: team.name, seasonId, placement: "Didnt make playoffs" })
        .returning();
      if (!created) throw new BadRequestError(`Could not create team "${team.name}"`);
      teamIdByName.set(key, created.id);
      teamsCreated += 1;
    }
  }

  if (includePlayers) {
    for (const team of activeTeams) {
      const teamId = teamIdByName.get(normalizeName(team.name));
      if (!teamId) {
        if (input.mode === "players") {
          preview.warnings.push(`Skipped players for missing team "${team.name}"`);
          continue;
        }
        throw new BadRequestError(`Team "${team.name}" was not created`);
      }

      const roleByPlayer = new Map<string, "C" | "VC" | "CC">();
      if (team.leadership) {
        for (const role of ["C", "VC", "CC"] as const) {
          const captain = team.leadership[role];
          if (!captain) continue;
          roleByPlayer.set(normalizeName(captain), role);
          // Captains must land on the roster even if a regional tab omitted them.
          if (!team.playerNames.some((name) => normalizeName(name) === normalizeName(captain))) {
            team.playerNames.unshift(captain);
          }
        }
      }

      const rosterLinks: { teamId: number; playerId: number }[] = [];
      for (const playerName of team.playerNames) {
        const { id: playerId, created } = await getOrCreatePlayer(db, playerName);
        if (created) playersCreated += 1;
        rosterLinks.push({ teamId, playerId });
      }
      await insertManyIgnore(db, teamsPlayers, rosterLinks);
      playersAttached += rosterLinks.length;

      // Assign leadership after the roster is linked so unique role slots stay consistent.
      if (roleByPlayer.size > 0) {
        await db
          .update(teamsPlayers)
          .set({ role: sql`NULL` })
          .where(and(eq(teamsPlayers.teamId, teamId), sql`${teamsPlayers.role} is not null`));
        const seat = await db
          .select({ playerId: teamsPlayers.playerId, name: players.name })
          .from(teamsPlayers)
          .innerJoin(players, eq(teamsPlayers.playerId, players.id))
          .where(eq(teamsPlayers.teamId, teamId));
        for (const [playerKey, role] of roleByPlayer) {
          const match = seat.find((row) => normalizeName(row.name) === playerKey);
          if (!match) {
            preview.warnings.push(
              `Could not assign ${role} on "${team.name}" — player "${playerKey}" missing from roster`,
            );
            continue;
          }
          await db
            .update(teamsPlayers)
            .set({ role })
            .where(and(eq(teamsPlayers.teamId, teamId), eq(teamsPlayers.playerId, match.playerId)));
        }
      } else if (team.playerNames.length > 0) {
        preview.warnings.push(
          `No captaincy (C/VC/CC) found for "${team.name}" — check the master TEAMS header row`,
        );
      }
    }
  }

  const gameIdByKey = new Map<string, number>();

  if (includeGames) {
    for (const game of preview.games.filter((row) => row.included)) {
      const team1Id = teamIdByName.get(normalizeName(game.team1Name));
      const team2Id = teamIdByName.get(normalizeName(game.team2Name));
      if (!team1Id || !team2Id) {
        preview.warnings.push(
          `Skipped game ${game.team1Name} vs ${game.team2Name} (missing team ids)`,
        );
        continue;
      }

      const status = game.team1Score != null && game.team2Score != null ? "completed" : "scheduled";
      const [created] = await db
        .insert(games)
        .values({
          name: `${game.team1Name} Vs. ${game.team2Name}`,
          matchNumber: game.round,
          round: game.round,
          status,
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
        })
        .returning();

      if (!created) continue;
      await insertMany(db, teamsGames, [
        { gameId: created.id, teamId: team1Id, slot: 1 },
        { gameId: created.id, teamId: team2Id, slot: 2 },
      ]);
      gameIdByKey.set(game.key, created.id);
      gamesCreated += 1;
    }
  }

  if (includeStats) {
    const playerCache = new Map<string, number>();
    const allNames = [...new Set(preview.stats.map((row) => row.playerName.toLowerCase()))];
    if (allNames.length > 0) {
      const chunkSize = 80;
      for (let index = 0; index < allNames.length; index += chunkSize) {
        const chunk = allNames.slice(index, index + chunkSize);
        const rows = await db.select().from(players).where(inArray(players.name, chunk));
        for (const row of rows) playerCache.set(row.name, row.id);
      }
    }

    for (const row of preview.stats) {
      const gameId = gameIdByKey.get(row.gameKey);
      if (!gameId) continue;

      let playerId = playerCache.get(row.playerName.toLowerCase());
      if (!playerId) {
        const created = await getOrCreatePlayer(db, row.playerName);
        playerId = created.id;
        playerCache.set(row.playerName.toLowerCase(), playerId);
        if (created.created) playersCreated += 1;

        // Attach to team if possible
        const teamId = teamIdByName.get(normalizeName(row.teamName));
        if (teamId) {
          await db.insert(teamsPlayers).values({ teamId, playerId }).onConflictDoNothing();
        }
      }

      const existing = await db.query.stats.findFirst({
        where: and(eq(stats.playerId, playerId), eq(stats.gameId, gameId)),
      });
      if (existing) continue;

      await db.insert(stats).values({
        playerId,
        gameId,
        ...row.counts,
      });
      statsCreated += 1;
    }
  }

  if (options.queue && input.mode === "full") {
    const { enqueueRecalculation } = await import("../../queue");
    await enqueueRecalculation(db, options.queue, {
      seasonId,
      requestedBy: options.requestedBy ?? null,
    });
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

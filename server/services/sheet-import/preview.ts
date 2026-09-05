import { eq, inArray } from "drizzle-orm";
import type { Db } from "@db";
import { players, seasons } from "@db/schema";
import { BadRequestError } from "../errors";
import { matchStatsToGames, mergeTeamRosters, rosterSizeWarnings } from "./match";
import { normalizeName } from "./names";
import { loadMasterSource, loadRegionalSource } from "./sources";
import type { FetchImpl } from "./fetch";
import type {
  AssembledSources,
  ParsedGame,
  ParsedScoreBlock,
  ParsedTeam,
  SheetImportInput,
  SheetImportPreview,
  SheetRegion,
  PreviewTeam,
  PreviewGame,
  PreviewPlayer,
} from "./types";

export type { AssembledSources };

function teamKey(name: string, region: SheetRegion | null): string {
  return `${region ?? "all"}:${normalizeName(name)}`;
}

function yearFromDate(iso?: string): number {
  if (iso && /^\d{4}/.test(iso)) return Number.parseInt(iso.slice(0, 4), 10);
  return new Date().getUTCFullYear();
}

async function existingPlayerNames(db: Db, names: string[]): Promise<Set<string>> {
  if (names.length === 0) return new Set();
  const lowered = [...new Set(names.map((name) => name.toLowerCase()))];
  const found = new Set<string>();
  const chunkSize = 80;
  for (let index = 0; index < lowered.length; index += chunkSize) {
    const chunk = lowered.slice(index, index + chunkSize);
    const rows = await db
      .select({ name: players.name })
      .from(players)
      .where(inArray(players.name, chunk));
    for (const row of rows) found.add(row.name);
  }
  return found;
}

export async function validateSheetImportMeta(
  db: Db,
  input: SheetImportInput,
): Promise<{
  errors: string[];
  warnings: string[];
  seasonNumber: number | null;
  seasonId: number | null;
}> {
  const errors: string[] = [];
  const warnings: string[] = [];
  let seasonNumber: number | null = input.seasonNumber ?? null;
  let seasonId: number | null = input.seasonId ?? null;
  const mode = input.mode;

  if (mode === "full") {
    if (input.seasonNumber == null) errors.push("Season number is required");
    if (!input.startDate) errors.push("Start date is required");
    if (input.seasonNumber != null) {
      const existing = await db.query.seasons.findFirst({
        where: eq(seasons.seasonNumber, input.seasonNumber),
      });
      if (existing) {
        warnings.push(
          `Season ${input.seasonNumber} already exists — import will resume into season ${existing.id}.`,
        );
        seasonId = existing.id;
      }
      seasonNumber = input.seasonNumber;
    }
  } else {
    if (input.seasonId == null) errors.push("Season is required");
    else {
      const season = await db.query.seasons.findFirst({ where: eq(seasons.id, input.seasonId) });
      if (!season) errors.push(`Season ${input.seasonId} not found`);
      else {
        seasonId = season.id;
        seasonNumber = season.seasonNumber;
      }
    }
  }

  return { errors, warnings, seasonNumber, seasonId };
}

export async function assembleSheetImportPreview(
  db: Db,
  input: SheetImportInput,
  sources: AssembledSources,
): Promise<SheetImportPreview> {
  const { errors: metaErrors, warnings: metaWarnings, seasonNumber, seasonId } =
    await validateSheetImportMeta(db, input);
  const errors = [...metaErrors];
  const warnings = [...sources.sourceWarnings, ...metaWarnings];
  const mode = input.mode;

  if (mode === "full" && sources.masterTeams.length === 0) {
    errors.push("Master sheet did not yield any teams (expected NA/EU/AS TEAMS tabs)");
  }

  if (
    mode !== "full" &&
    sources.masterTeams.length === 0 &&
    sources.regionalTeams.length === 0
  ) {
    errors.push("Provide a master sheet and/or at least one regional stats sheet");
  }

  const empty = (): SheetImportPreview => ({
    mode,
    seasonNumber,
    seasonId,
    counts: {
      teams: 0,
      players: 0,
      playersNew: 0,
      playersExisting: 0,
      games: 0,
      stats: 0,
      warnings: warnings.length,
      errors: errors.length,
    },
    teams: [],
    players: [],
    games: [],
    stats: [],
    warnings,
    errors,
  });

  if (errors.length > 0 && mode === "full" && sources.masterTeams.length === 0) {
    return empty();
  }
  // Still assemble when only soft errors like duplicate season — show data with errors listed
  if (metaErrors.length > 0 && sources.masterTeams.length === 0 && sources.regionalTeams.length === 0) {
    return empty();
  }

  const includeGames = mode === "full";
  const includePlayers = mode === "full" || mode === "teams_and_players" || mode === "players";
  const includeTeams = mode === "full" || mode === "teams" || mode === "teams_and_players";

  const merged = mergeTeamRosters(
    includeTeams || includePlayers ? sources.masterTeams : [],
    includeTeams || includePlayers ? sources.regionalTeams : [],
  );

  const excludeTeams = new Set((input.excludeTeamKeys ?? []).map((key) => key.toLowerCase()));
  const excludeGames = new Set((input.excludeGameKeys ?? []).map((key) => key.toLowerCase()));

  let teams: PreviewTeam[] = merged.map((team) => {
    const key = teamKey(team.name, team.region as SheetRegion | null);
    const row: PreviewTeam = {
      key,
      name: team.name,
      region: team.region as SheetRegion | null,
      playerNames: includePlayers ? team.playerNames : [],
      included: !excludeTeams.has(key.toLowerCase()),
    };
    if (includePlayers && team.leadership) row.leadership = team.leadership;
    return row;
  });

  if (!includeTeams && !includePlayers) {
    teams = [];
  } else if (!includeTeams && includePlayers) {
    // keep teams as assignment targets
  } else if (!includeTeams) {
    teams = [];
  }

  const activeTeams = teams.filter((team) => team.included);
  const playerRows: PreviewPlayer[] = [];
  if (includePlayers) {
    for (const team of activeTeams) {
      for (const playerName of team.playerNames) {
        playerRows.push({
          name: playerName.toLowerCase(),
          teamName: team.name,
          exists: false,
        });
      }
    }
  }

  const uniquePlayerNames = [...new Set(playerRows.map((row) => row.name))];
  const existing = await existingPlayerNames(db, uniquePlayerNames);
  for (const row of playerRows) {
    row.exists = existing.has(row.name);
  }

  const matched =
    includeGames && sources.regionalBlocks.length > 0
      ? matchStatsToGames(sources.masterGames, sources.regionalBlocks)
      : {
          stats: [],
          matchedCountByGameKey: new Map<string, number>(),
          warnings: [] as string[],
          syntheticGames: [] as ParsedGame[],
        };

  warnings.push(...matched.warnings);

  const importGames = includeGames
    ? [...sources.masterGames, ...matched.syntheticGames]
    : [];

  const games: PreviewGame[] = includeGames
    ? importGames.map((game) => ({
        key: game.key,
        region: game.region,
        phase: game.phase,
        round: game.round,
        date: game.date,
        team1Name: game.team1Name,
        team2Name: game.team2Name,
        team1Score: game.team1Score,
        team2Score: game.team2Score,
        setScores: game.setScores,
        forfeit: game.forfeit,
        matchedStatCount: matched.matchedCountByGameKey.get(game.key) ?? 0,
        included: !excludeGames.has(game.key.toLowerCase()),
      }))
    : [];

  const activeGameKeys = new Set(games.filter((game) => game.included).map((game) => game.key));
  const stats = matched.stats.filter((stat) => activeGameKeys.has(stat.gameKey));

  if (includeTeams && includeGames) {
    const known = new Set(teams.map((team) => normalizeName(team.name)));
    for (const game of games) {
      for (const name of [game.team1Name, game.team2Name]) {
        if (!known.has(normalizeName(name))) {
          warnings.push(`Game references team "${name}" which was not found on TEAMS tabs`);
          const key = teamKey(name, game.region);
          teams.push({
            key,
            name,
            region: game.region,
            playerNames: [],
            included: !excludeTeams.has(key.toLowerCase()),
          });
          known.add(normalizeName(name));
        }
      }
    }
  }

  const newNames = new Set(playerRows.filter((row) => !row.exists).map((row) => row.name));
  const existingNames = new Set(playerRows.filter((row) => row.exists).map((row) => row.name));

  warnings.push(...rosterSizeWarnings(teams));

  if (includePlayers) {
    const teamsByPlayer = new Map<string, { label: string; teams: string[] }>();
    for (const team of activeTeams) {
      for (const playerName of team.playerNames) {
        const key = normalizeName(playerName);
        const entry = teamsByPlayer.get(key) ?? { label: playerName, teams: [] };
        if (!entry.teams.includes(team.name)) entry.teams.push(team.name);
        teamsByPlayer.set(key, entry);
      }
    }
    for (const entry of teamsByPlayer.values()) {
      if (entry.teams.length > 1) {
        warnings.push(
          `Player "${entry.label}" appears on multiple teams: ${entry.teams.join(", ")}`,
        );
      }
    }
  }

  if (includePlayers) {
    for (const team of teams.filter((row) => row.included)) {
      const roles = team.leadership ? Object.keys(team.leadership).length : 0;
      if (team.playerNames.length > 0 && roles === 0) {
        warnings.push(
          `No captaincy (C/VC/CC) found for "${team.name}" — master TEAMS header cell should list captains beside the title`,
        );
      }
    }
  }

  return {
    mode,
    seasonNumber,
    seasonId,
    counts: {
      teams: teams.filter((team) => team.included).length,
      players: uniquePlayerNames.length,
      playersNew: newNames.size,
      playersExisting: existingNames.size,
      games: games.filter((game) => game.included).length,
      stats: stats.length,
      warnings: warnings.length,
      errors: errors.length,
    },
    teams,
    players: playerRows,
    games,
    stats,
    warnings,
    errors,
  };
}

export async function buildSheetImportPreview(
  db: Db,
  input: SheetImportInput,
  fetchImpl: FetchImpl = fetch,
): Promise<SheetImportPreview> {
  const fallbackYear = yearFromDate(input.startDate);
  const sourceWarnings: string[] = [];
  let masterTeams: ParsedTeam[] = [];
  let masterGames: ParsedGame[] = [];
  const regionalTeams: ParsedTeam[] = [];
  const regionalBlocks: ParsedScoreBlock[] = [];

  try {
    if (input.masterUrl) {
      const master = await loadMasterSource(input.masterUrl, fallbackYear, fetchImpl);
      masterTeams = master.teams;
      masterGames = master.games;
      sourceWarnings.push(...master.warnings);
    }

    const regionalEntries: Array<[SheetRegion, string | undefined]> = [
      ["na", input.regionalUrls?.na],
      ["eu", input.regionalUrls?.eu],
      ["as", input.regionalUrls?.as],
    ];

    for (const [region, url] of regionalEntries) {
      if (!url) continue;
      const regional = await loadRegionalSource(url, region, fetchImpl);
      regionalTeams.push(...regional.teams);
      regionalBlocks.push(...regional.blocks);
      sourceWarnings.push(...regional.warnings);
    }
  } catch (error) {
    const { errors, warnings: metaWarnings, seasonNumber, seasonId } =
      await validateSheetImportMeta(db, input);
    errors.push(error instanceof Error ? error.message : String(error));
    return {
      mode: input.mode,
      seasonNumber,
      seasonId,
      counts: {
        teams: 0,
        players: 0,
        playersNew: 0,
        playersExisting: 0,
        games: 0,
        stats: 0,
        warnings: metaWarnings.length,
        errors: errors.length,
      },
      teams: [],
      players: [],
      games: [],
      stats: [],
      warnings: metaWarnings,
      errors,
    };
  }

  return assembleSheetImportPreview(db, input, {
    masterTeams,
    masterGames,
    regionalTeams,
    regionalBlocks,
    sourceWarnings,
  });
}

export function assertPreviewCommitable(preview: SheetImportPreview): void {
  if (preview.errors.length > 0) {
    throw new BadRequestError(preview.errors[0] ?? "Import preview has errors");
  }
  if (preview.mode === "full" && preview.counts.teams === 0) {
    throw new BadRequestError("Nothing to import");
  }
}

export { yearFromDate };

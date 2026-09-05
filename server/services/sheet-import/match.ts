import { namesEqual, normalizeName } from "./names";
import { syntheticGameKey } from "./keys";
import type { ParsedGame, ParsedScoreBlock, PreviewStat, SheetStatCounts } from "./types";

function emptyCounts(): SheetStatCounts {
  return {
    spikeKills: 0,
    spikeAttempts: 0,
    spikingErrors: 0,
    apeKills: 0,
    apeAttempts: 0,
    assists: 0,
    settingErrors: 0,
    blocks: 0,
    blockFollows: 0,
    digs: 0,
    aces: 0,
    servingErrors: 0,
    miscErrors: 0,
  };
}

function scoresMatch(
  game: ParsedGame,
  block: ParsedScoreBlock,
): boolean {
  const g1 = game.team1Score;
  const g2 = game.team2Score;
  if (g1 == null || g2 == null) return false;

  const blockIsTeam1 = namesEqual(block.teamName, game.team1Name);
  const blockIsTeam2 = namesEqual(block.teamName, game.team2Name);
  if (!blockIsTeam1 && !blockIsTeam2) return false;

  // Score line is always "left-right Winner" from that team's sheet perspective:
  // left = sets for the sheet's team? Looking at samples:
  // On Teiko sheet: "Score: 2-0 Teiko" (Teiko won 2-0)
  // On Teiko sheet: "Score: 1-3 Tenjiku" (Teiko lost 1-3, Tenjiku won)
  // So left = this team's sets, right = opponent's sets.
  const thisScore = block.teamScore;
  const oppScore = block.opponentScore;

  if (blockIsTeam1) {
    return g1 === thisScore && g2 === oppScore;
  }
  return g2 === thisScore && g1 === oppScore;
}

function opponentFromBlock(block: ParsedScoreBlock): string | null {
  if (!namesEqual(block.winnerName, block.teamName)) {
    return block.winnerName;
  }
  return null;
}

function gamePairKey(region: string, teamA: string, teamB: string): string {
  const left = normalizeName(teamA);
  const right = normalizeName(teamB);
  return `${region}|${left < right ? `${left}|${right}` : `${right}|${left}`}`;
}

function attachBlock(
  block: ParsedScoreBlock,
  gameKeyValue: string,
  stats: PreviewStat[],
  matchedCountByGameKey: Map<string, number>,
): void {
  for (const row of block.rows) {
    stats.push({
      gameKey: gameKeyValue,
      teamName: block.teamName,
      playerName: row.playerName,
      counts: {
        spikeKills: row.spikeKills,
        spikeAttempts: row.spikeAttempts,
        spikingErrors: row.spikingErrors,
        apeKills: row.apeKills,
        apeAttempts: row.apeAttempts,
        assists: row.assists,
        settingErrors: row.settingErrors,
        blocks: row.blocks,
        blockFollows: row.blockFollows,
        digs: row.digs,
        aces: row.aces,
        servingErrors: row.servingErrors,
        miscErrors: row.miscErrors,
      },
    });
  }
  matchedCountByGameKey.set(
    gameKeyValue,
    (matchedCountByGameKey.get(gameKeyValue) ?? 0) + block.rows.length,
  );
}

function syntheticGameFromBlock(block: ParsedScoreBlock): ParsedGame {
  const opponent = opponentFromBlock(block);
  if (!opponent) {
    throw new Error("Synthetic game requires a known opponent");
  }
  const key = syntheticGameKey(
    block.region,
    block.teamName,
    opponent,
    block.teamScore,
    block.opponentScore,
  );
  return {
    key,
    region: block.region,
    phase: "playoffs",
    round: "From stats sheet",
    date: "1970-01-01",
    team1Name: block.teamName,
    team2Name: opponent,
    team1Score: block.teamScore,
    team2Score: block.opponentScore,
    setScores: [],
    forfeit: false,
  };
}

export function matchStatsToGames(
  games: ParsedGame[],
  blocks: ParsedScoreBlock[],
): {
  stats: PreviewStat[];
  matchedCountByGameKey: Map<string, number>;
  warnings: string[];
  syntheticGames: ParsedGame[];
} {
  const warnings: string[] = [];
  const stats: PreviewStat[] = [];
  const matchedCountByGameKey = new Map<string, number>();
  const syntheticGames: ParsedGame[] = [];
  const usedBlocks = new Set<number>();

  for (const game of games) {
    const matches: number[] = [];
    for (let index = 0; index < blocks.length; index += 1) {
      if (usedBlocks.has(index)) continue;
      const block = blocks[index];
      if (!block) continue;
      if (block.region !== game.region) continue;

      const isSide =
        namesEqual(block.teamName, game.team1Name) || namesEqual(block.teamName, game.team2Name);
      if (!isSide) continue;

      const opponent = opponentFromBlock(block);
      if (opponent) {
        const expectedOpp = namesEqual(block.teamName, game.team1Name)
          ? game.team2Name
          : game.team1Name;
        if (!namesEqual(opponent, expectedOpp)) continue;
      }

      if (!scoresMatch(game, block)) continue;
      matches.push(index);
    }

    for (const index of matches) {
      usedBlocks.add(index);
      const block = blocks[index];
      if (!block) continue;
      attachBlock(block, game.key, stats, matchedCountByGameKey);
    }
  }

  // When bracket parsing yields wrong set totals, still attach stats if the team pair is unique.
  for (let index = 0; index < blocks.length; index += 1) {
    if (usedBlocks.has(index)) continue;
    const block = blocks[index];
    if (!block || block.rows.length === 0) continue;

    const opponent = opponentFromBlock(block);
    if (!opponent) continue;

    const pairKey = gamePairKey(block.region, block.teamName, opponent);
    const candidates = games.filter(
      (game) =>
        game.region === block.region &&
        gamePairKey(game.region, game.team1Name, game.team2Name) === pairKey,
    );
    if (candidates.length !== 1) continue;

    usedBlocks.add(index);
    attachBlock(block, candidates[0]!.key, stats, matchedCountByGameKey);
  }

  // Bracket sheets often omit or garble playoff rows — synthesize a game from the stats tab.
  for (let index = 0; index < blocks.length; index += 1) {
    if (usedBlocks.has(index)) continue;
    const block = blocks[index];
    if (!block || block.rows.length === 0) continue;

    const opponent = opponentFromBlock(block);
    if (!opponent) continue;

    const pairKey = gamePairKey(block.region, block.teamName, opponent);
    const alreadyScheduled = games.some(
      (game) => gamePairKey(game.region, game.team1Name, game.team2Name) === pairKey,
    );
    if (alreadyScheduled) continue;

    const synthetic = syntheticGameFromBlock(block);
    syntheticGames.push(synthetic);
    usedBlocks.add(index);
    attachBlock(block, synthetic.key, stats, matchedCountByGameKey);
  }

  for (let index = 0; index < blocks.length; index += 1) {
    if (usedBlocks.has(index)) continue;
    const block = blocks[index];
    if (!block) continue;
    warnings.push(
      `Unmatched score block: ${block.teamName} ${block.teamScore}-${block.opponentScore} (winner ${block.winnerName}, ${block.region})`,
    );
  }

  return { stats, matchedCountByGameKey, warnings, syntheticGames };
}

type RosterTeam = {
  name: string;
  region: string | null;
  playerNames: string[];
  leadership?: Partial<Record<"C" | "VC" | "CC", string>> | undefined;
};

const LEADERSHIP_ROLES = ["C", "VC", "CC"] as const;

/** Ensure every named captain/VC/CC is present on the roster list. */
export function ensureLeadershipOnRoster(team: RosterTeam): RosterTeam {
  if (!team.leadership) return team;
  const names = [...team.playerNames];
  for (const role of LEADERSHIP_ROLES) {
    const captain = team.leadership[role];
    if (!captain) continue;
    if (!names.some((name) => normalizeName(name) === normalizeName(captain))) {
      names.unshift(captain);
    }
  }
  return { ...team, playerNames: names, leadership: { ...team.leadership } };
}

/**
 * Merge master + regional teams. Regional stats tabs are the roster source of truth when
 * present — unioning master Group A columns with later-group leakage inflated rosters badly.
 * Master TEAMS headers still own captaincy (C / VC / CC); those roles are always kept and
 * the named captains are forced onto the merged roster when missing from regional tabs.
 */
export function mergeTeamRosters(
  master: RosterTeam[],
  regional: RosterTeam[],
): RosterTeam[] {
  const byName = new Map<string, RosterTeam & { fromRegional: boolean }>();

  for (const team of master) {
    const keyed = ensureLeadershipOnRoster(team);
    const entry: RosterTeam & { fromRegional: boolean } = {
      name: keyed.name,
      region: keyed.region,
      playerNames: [...keyed.playerNames],
      fromRegional: false,
    };
    if (keyed.leadership) entry.leadership = { ...keyed.leadership };
    byName.set(normalizeName(team.name), entry);
  }

  for (const team of regional) {
    const key = normalizeName(team.name);
    const existing = byName.get(key);
    if (!existing) {
      const keyed = ensureLeadershipOnRoster(team);
      const entry: RosterTeam & { fromRegional: boolean } = {
        name: keyed.name,
        region: keyed.region,
        playerNames: [...keyed.playerNames],
        fromRegional: true,
      };
      if (keyed.leadership) entry.leadership = { ...keyed.leadership };
      byName.set(key, entry);
      continue;
    }
    if (!existing.region && team.region) existing.region = team.region;
    if (team.playerNames.length > 0) {
      // Prefer the regional roster, then re-apply master captaincy onto it.
      existing.playerNames = [...team.playerNames];
      existing.fromRegional = true;
      const withLeaders = ensureLeadershipOnRoster({
        name: existing.name,
        region: existing.region,
        playerNames: existing.playerNames,
        ...(existing.leadership ? { leadership: existing.leadership } : {}),
      });
      existing.playerNames = withLeaders.playerNames;
      if (withLeaders.leadership) existing.leadership = withLeaders.leadership;
    }
  }

  return [...byName.values()]
    .map(({ name, region, playerNames, leadership }) => {
      const team: RosterTeam = { name, region, playerNames };
      if (leadership && Object.keys(leadership).length > 0) team.leadership = leadership;
      return team;
    })
    .sort((left, right) => left.name.localeCompare(right.name));
}

/** Soft limits for volleyball-style rosters — warn only, never block import. */
export const ROSTER_WARN_MIN = 3;
export const ROSTER_WARN_MAX = 14;

export function rosterSizeWarnings(
  teams: { name: string; region: string | null; playerNames: string[]; included?: boolean }[],
): string[] {
  const warnings: string[] = [];
  for (const team of teams) {
    if (team.included === false) continue;
    const count = team.playerNames.length;
    if (count === 0) continue;
    if (count > ROSTER_WARN_MAX) {
      warnings.push(
        `Team "${team.name}" has ${count} players (expected ≤ ${ROSTER_WARN_MAX}) — roster parse likely pulled in other groups or match appearances`,
      );
    } else if (count < ROSTER_WARN_MIN) {
      warnings.push(
        `Team "${team.name}" has only ${count} player${count === 1 ? "" : "s"} (expected ≥ ${ROSTER_WARN_MIN})`,
      );
    }
  }
  return warnings;
}

export { emptyCounts };

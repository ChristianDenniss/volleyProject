import { parseCsv, cell } from "./csv";
import { displayName, normalizeName } from "./names";
import type { ParsedScoreBlock, ParsedStatRow, ParsedTeam, SheetRegion, SheetStatCounts } from "./types";

const SKIP_TABS = new Set([
  "teams",
  "players",
  "players per set",
  "main",
  "main tab",
]);

const ZERO_COUNTS: SheetStatCounts = {
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

type StatField = keyof SheetStatCounts;

/** Map noisy header text to a stats column. Order matters for ambiguous "errors". */
function mapHeader(raw: string): StatField | null {
  const key = raw.toLowerCase().replace(/[^a-z]/g, "");
  if (!key || key === "players" || key === "player") return null;

  const rules: Array<[RegExp, StatField]> = [
    [/^(apeerrors|apeerror)$/, "miscErrors"], // not stored separately; fold into misc if needed — prefer skip
    [/^(apekills|apekill)$/, "apeKills"],
    [/^(apeattempts|apeattempt)$/, "apeAttempts"],
    [/^(spikingerrors|spikeerrors|spikingerror)$/, "spikingErrors"],
    [/^(spikekills|kills|kill)$/, "spikeKills"],
    [/^(spikeattempts|attempts|attempt)$/, "spikeAttempts"],
    [/^(totalkills|totalkill)$/, "spikeKills"], // only if spike kills missing — handled in row parse
    [/^(totalattempts)$/, "spikeAttempts"],
    [/^(killblocks|blocks|totalblocks)$/, "blocks"],
    [/^(blockfollows|bfs|bf)$/, "blockFollows"],
    [/^(digs|totaldigs)$/, "digs"],
    [/^(assists|totalassists)$/, "assists"],
    [/^(seterrors|settingerrors|seterrs)$/, "settingErrors"],
    [/^(aces|totalaces)$/, "aces"],
    [/^(serveerrors|servingerrors)$/, "servingErrors"],
    [/^(miscerrors|miscerrs)$/, "miscErrors"],
  ];

  for (const [pattern, field] of rules) {
    if (pattern.test(key)) return field;
  }
  return null;
}

function parseScoreLine(line: string): { teamScore: number; opponentScore: number; winnerName: string } | null {
  const match = line.match(/Score:\s*(\d+)\s*-\s*(\d+)\s+(.+)/i);
  if (!match?.[1] || !match[2] || !match[3]) return null;
  return {
    teamScore: Number.parseInt(match[1], 10),
    opponentScore: Number.parseInt(match[2], 10),
    winnerName: displayName(match[3]),
  };
}

function isPlayerRow(name: string): boolean {
  const n = normalizeName(name);
  if (!n) return false;
  if (n === "total" || n.startsWith("total:")) return false;
  if (n === "players" || n === "score") return false;
  if (/^score:/i.test(name)) return false;
  return true;
}

function parseStatRow(cells: string[], fields: Array<StatField | null>): ParsedStatRow | null {
  const playerName = displayName(cells[0] ?? "");
  if (!isPlayerRow(playerName)) return null;

  const counts: SheetStatCounts = { ...ZERO_COUNTS };
  let hasAny = false;

  fields.forEach((field, index) => {
    if (!field) return;
    // column 0 is player name
    const raw = cells[index] ?? "";
    const parsed = Number.parseInt(raw, 10);
    if (!Number.isFinite(parsed)) return;
    // Prefer first mapping for a field (headers can duplicate)
    if (counts[field] === 0) {
      counts[field] = parsed;
      hasAny = true;
    }
  });

  // Rows that are all zeros still count as participation if name present
  if (!hasAny && cells.slice(1).every((value) => !value || value === "0" || value === "")) {
    return { playerName, ...counts };
  }

  return { playerName, ...counts };
}

function headersFromFirstRow(row: string[]): Array<StatField | null> {
  return row.map((value, index) => (index === 0 ? null : mapHeader(value)));
}

/** Infer field layout from the known regional team-tab column order when headers are messy. */
function defaultTeamTabFields(columnCount: number): Array<StatField | null> {
  // Observed order (c2s2 Teiko / c2s1 Inter Milan):
  // player, apeErrors, apeKills, apeAttempts, apeFG%, spikingErrors, kills, attempts, killFG%,
  // totalKills, totalAttempts, totalFG%, totalBlocks, killBlocks, softBlocks, oneTouches,
  // assists, totalReceives, digs, BFs, aces, totalErrors, miscErrors, setErrors, serveErrors, ...
  const layout: Array<StatField | null> = [
    null, // player
    null, // ape errors (no column)
    "apeKills",
    "apeAttempts",
    null, // ape fg%
    "spikingErrors",
    "spikeKills",
    "spikeAttempts",
    null, // kill fg%
    null, // total kills (derived)
    null, // total attempts
    null, // total fg%
    null, // total blocks
    "blocks", // kill blocks
    null, // soft
    null, // one touches
    "assists",
    null, // receives
    "digs",
    "blockFollows",
    "aces",
    null, // total errors
    "miscErrors",
    "settingErrors",
    "servingErrors",
  ];
  while (layout.length < columnCount) layout.push(null);
  return layout.slice(0, columnCount);
}

/** Build team → player names from the regional PLAYERS leaderboard tab. */
export function parseRegionalPlayersLeaderboard(csv: string): Map<string, string[]> {
  const rows = parseCsv(csv);
  if (rows.length === 0) return new Map();

  const header = rows[0] ?? [];
  const pairs: Array<{ playerCol: number; teamCol: number }> = [];

  for (let index = 1; index < header.length; index += 1) {
    const label = cell(header, index).toLowerCase().replace(/[^a-z]/g, "");
    if (label !== "team" && label !== "teams") continue;
    pairs.push({ playerCol: index - 1, teamCol: index });
  }

  if (pairs.length === 0) {
    pairs.push({ playerCol: 1, teamCol: 2 });
  }

  const byTeam = new Map<string, string[]>();

  for (let rowIndex = 1; rowIndex < rows.length; rowIndex += 1) {
    const row = rows[rowIndex] ?? [];
    for (const { playerCol, teamCol } of pairs) {
      const playerName = displayName(cell(row, playerCol));
      const teamName = displayName(cell(row, teamCol));
      if (!isPlayerRow(playerName) || !teamName || teamName.length < 2) continue;
      if (/^team$/i.test(teamName) || /leaderboard/i.test(teamName)) continue;

      const key = normalizeName(teamName);
      const bucket = byTeam.get(key) ?? [];
      if (!bucket.some((name) => normalizeName(name) === normalizeName(playerName))) {
        bucket.push(playerName);
      }
      byTeam.set(key, bucket);
    }
  }

  return byTeam;
}

export function parseRegionalTeamTab(
  tabName: string,
  csv: string,
  region: SheetRegion,
): { team: ParsedTeam; blocks: ParsedScoreBlock[]; warnings: string[] } {
  const rows = parseCsv(csv);
  const warnings: string[] = [];
  const teamName = displayName(tabName);
  const seasonRoster = new Set<string>();
  const appearanceRoster = new Set<string>();
  const blocks: ParsedScoreBlock[] = [];

  let fields: Array<StatField | null> | null = null;
  let inGame = false;
  let current: ParsedScoreBlock | null = null;
  let sawScore = false;

  for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
    const row = rows[rowIndex] ?? [];
    const first = cell(row, 0);

    if (/^Score:/i.test(first)) {
      sawScore = true;
      const parsed = parseScoreLine(first);
      if (current && current.rows.length > 0) blocks.push(current);
      current = parsed
        ? {
            teamName,
            region,
            winnerName: parsed.winnerName,
            teamScore: parsed.teamScore,
            opponentScore: parsed.opponentScore,
            rows: [],
          }
        : null;
      inGame = Boolean(current);
      continue;
    }

    if (/^TOTAL:/i.test(first)) {
      inGame = false;
      if (current && current.rows.length > 0) {
        blocks.push(current);
        current = null;
      }
      continue;
    }

    if (/^Players$/i.test(first) || normalizeName(first) === normalizeName(teamName)) {
      continue;
    }

    // Header row detection
    if (!fields && rowIndex === 0) {
      const mapped = headersFromFirstRow(row);
      const mappedCount = mapped.filter(Boolean).length;
      fields = mappedCount >= 4 ? mapped : defaultTeamTabFields(row.length);
      continue;
    }

    if (!fields) fields = defaultTeamTabFields(row.length);

    const stat = parseStatRow(row, fields);
    if (!stat) continue;

    if (!sawScore) {
      seasonRoster.add(stat.playerName);
    } else if (inGame && current) {
      current.rows.push(stat);
      appearanceRoster.add(stat.playerName);
    }
  }

  if (current && current.rows.length > 0) blocks.push(current);

  // Prefer the season-totals block above the first Score:; fall back to unique appearances.
  const roster = seasonRoster.size > 0 ? seasonRoster : appearanceRoster;

  if (roster.size === 0) {
    warnings.push(`No players found on ${region.toUpperCase()} team "${tabName}"`);
  }

  return {
    team: {
      name: teamName,
      region,
      playerNames: [...roster],
    },
    blocks,
    warnings,
  };
}

export function parseRegionalWorkbook(
  tabs: Map<string, string[]>,
  region: SheetRegion,
): { teams: ParsedTeam[]; blocks: ParsedScoreBlock[]; warnings: string[] } {
  const teams: ParsedTeam[] = [];
  const blocks: ParsedScoreBlock[] = [];
  const warnings: string[] = [];
  let playersByTeam: Map<string, string[]> | null = null;

  for (const [tabName, lines] of tabs) {
    const normalized = tabName.trim().toLowerCase().replace(/\s+/g, " ");
    if (normalized === "players") {
      playersByTeam = parseRegionalPlayersLeaderboard(lines.join("\n"));
      continue;
    }
    if (SKIP_TABS.has(normalized)) continue;
    if (normalized.endsWith("per set")) continue;
    if (/^team leaderboard/i.test(tabName)) continue;

    const csv = lines.join("\n");
    const parsed = parseRegionalTeamTab(tabName.trim(), csv, region);
    teams.push(parsed.team);
    blocks.push(...parsed.blocks);
    warnings.push(...parsed.warnings);
  }

  if (playersByTeam) {
    for (const team of teams) {
      if (team.playerNames.length > 0) continue;
      const fallback = playersByTeam.get(normalizeName(team.name));
      if (fallback && fallback.length > 0) team.playerNames = [...fallback];
    }

    const filled = new Set(
      teams.filter((team) => team.playerNames.length > 0).map((team) => team.name),
    );
    for (let index = warnings.length - 1; index >= 0; index -= 1) {
      const warning = warnings[index];
      if (!warning?.includes("No players found")) continue;
      const match = warning.match(/team "([^"]+)"/);
      if (match?.[1] && filled.has(match[1])) warnings.splice(index, 1);
    }
  }

  return { teams, blocks, warnings };
}

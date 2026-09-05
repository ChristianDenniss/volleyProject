import { parseCsv, cell } from "./csv";
import { masterGameKey } from "./keys";
import { displayName, normalizeName, parseTeamHeader } from "./names";
import type { ParsedGame, ParsedTeam, SheetRegion, TeamLeadershipRole } from "./types";

const REGION_TAB = /^(NA|EU|AS)\s+(TEAMS|QUALIFIERS|PLAYOFFS)$/i;
const LEADERSHIP_SLOTS: TeamLeadershipRole[] = ["C", "VC", "CC"];
const MONTHS: Record<string, number> = {
  jan: 1,
  january: 1,
  feb: 2,
  february: 2,
  mar: 3,
  march: 3,
  apr: 4,
  april: 4,
  may: 5,
  jun: 6,
  june: 6,
  jul: 7,
  july: 7,
  aug: 8,
  august: 8,
  sep: 9,
  sept: 9,
  september: 9,
  oct: 10,
  october: 10,
  nov: 11,
  november: 11,
  dec: 12,
  december: 12,
};

function regionFromCode(code: string): SheetRegion {
  return code.toLowerCase() as SheetRegion;
}

function isNoisePlayer(name: string): boolean {
  const n = normalizeName(name);
  if (!n) return true;
  if (n.length > 40) return true;
  if (/^\d+$/.test(n)) return true;
  if (["group a", "group b", "group c", "group d", "c", "vc"].includes(n)) return true;
  if (/\b(season|chapter|teams|group)\b/i.test(n)) return true;
  return false;
}

function looksLikeHandle(token: string): boolean {
  if (token.length < 3 || token.length > 32) return false;
  return /^[A-Za-z0-9_]+$/.test(token);
}

/** Prefer splitting on double spaces; also split single-spaced roblox handles. */
function playersFromCell(raw: string): string[] {
  const trimmed = raw.trim();
  if (!trimmed || trimmed.includes("|")) return [];

  const chunks = /\s{2,}/.test(trimmed) ? trimmed.split(/\s{2,}/) : [trimmed];
  const out: string[] = [];

  for (const chunk of chunks) {
    const parts = chunk.trim().split(/\s+/).filter(Boolean);
    if (parts.length > 1 && parts.every(looksLikeHandle)) {
      for (const part of parts) {
        const name = displayName(part);
        if (name && !isNoisePlayer(name)) out.push(name);
      }
      continue;
    }
    const name = displayName(chunk);
    if (name && !isNoisePlayer(name)) out.push(name);
  }

  return out;
}

function isGroupDivider(value: string): boolean {
  return /^group\s+[a-z0-9)]+/i.test(value.trim());
}

function addUniquePlayer(players: string[], raw: string): void {
  for (const player of playersFromCell(raw)) {
    if (!players.some((existing) => normalizeName(existing) === normalizeName(player))) {
      players.push(player);
    }
  }
}

/**
 * Master TEAMS tabs lay out several groups stacked vertically in the same columns.
 * Each team header only owns players until the next Group divider (or another header
 * in that column) — otherwise Group B/C/D names leak into Group A rosters.
 */
export function parseMasterTeamsTab(
  csv: string,
  region: SheetRegion,
): { teams: ParsedTeam[]; warnings: string[] } {
  const rows = parseCsv(csv);
  const warnings: string[] = [];

  const groupStarts: number[] = [];
  for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
    const row = rows[rowIndex] ?? [];
    for (let col = 0; col < row.length; col += 1) {
      if (isGroupDivider(cell(row, col))) {
        groupStarts.push(rowIndex);
        break;
      }
    }
  }

  type TeamColumn = {
    name: string;
    players: string[];
    leadership: Partial<Record<TeamLeadershipRole, string>>;
    headerRow: number;
    endRow: number;
  };
  const columns = new Map<number, TeamColumn>();

  for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
    const row = rows[rowIndex] ?? [];
    for (let index = 0; index < row.length; index += 1) {
      const value = cell(row, index);
      if (!value) continue;
      const header = parseTeamHeader(value);
      if (!header) continue;

      const nextGroup = groupStarts.find((start) => start > rowIndex);
      const endRow = nextGroup ?? rows.length;
      columns.set(index, {
        name: header,
        players: [],
        leadership: {},
        headerRow: rowIndex,
        endRow,
      });
    }
  }

  for (const [index, team] of columns) {
    for (let rowIndex = team.headerRow; rowIndex < team.endRow; rowIndex += 1) {
      const row = rows[rowIndex] ?? [];
      const value = cell(row, index);
      const adjacent = cell(row, index + 1);

      if (rowIndex === team.headerRow) {
        // Captains sit beside the title on the header row (C, VC, CC in order).
        if (adjacent && !parseTeamHeader(adjacent)) {
          const captains = playersFromCell(adjacent);
          captains.forEach((captain, slot) => {
            const role = LEADERSHIP_SLOTS[slot];
            if (!role) return;
            team.leadership[role] = captain;
            addUniquePlayer(team.players, captain);
          });
        }
        continue;
      }

      if (parseTeamHeader(value)) break;
      if (isGroupDivider(value) || isGroupDivider(adjacent)) break;

      const nextIsTeamCol = columns.has(index + 1);
      const candidates = nextIsTeamCol ? [value] : [value, adjacent];
      for (const candidate of candidates) {
        if (!candidate || parseTeamHeader(candidate)) continue;
        if (/^\d+$/.test(candidate.trim())) continue;
        addUniquePlayer(team.players, candidate);
      }
    }
  }

  const teams: ParsedTeam[] = [...columns.values()].map((team) => {
    const row: ParsedTeam = {
      name: team.name,
      region,
      playerNames: team.players,
    };
    if (Object.keys(team.leadership).length > 0) row.leadership = team.leadership;
    return row;
  });

  if (teams.length === 0) {
    warnings.push(`No teams parsed from ${region.toUpperCase()} TEAMS tab`);
  } else if (groupStarts.length > 1 && teams.length <= 4) {
    warnings.push(
      `${region.toUpperCase()} TEAMS tab only yielded ${teams.length} teams across ${groupStarts.length} groups — later groups often lack exportable headers; regional sheets are the better roster source`,
    );
  }

  return { teams, warnings };
}

function parseLooseDate(raw: string, fallbackYear: number): string | null {
  const text = raw.replace(/^Date:\s*/i, "").trim();
  if (!text) return null;

  const iso = text.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;

  const mdy = text.match(
    /\b(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\.?\s+(\d{1,2})(?:,?\s*(\d{4}))?/i,
  );
  if (!mdy?.[1] || !mdy[2]) return null;
  const month = MONTHS[mdy[1].toLowerCase().replace(/\.$/, "")];
  if (!month) return null;
  const day = Number.parseInt(mdy[2], 10);
  const year = mdy[3] ? Number.parseInt(mdy[3], 10) : fallbackYear;
  if (!Number.isFinite(day) || !Number.isFinite(year)) return null;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function isScoreToken(value: string): boolean {
  return /^-?\d+$/.test(value.trim());
}

/** Volleyball set scores stay in a small range; ranking points (26, 306, …) are not sets. */
function isVolleyballSetScore(value: string): boolean {
  if (!isScoreToken(value)) return false;
  const parsed = Number.parseInt(value, 10);
  return parsed >= 0 && parsed <= 35;
}

function looksLikeTeam(value: string): boolean {
  const name = displayName(value);
  if (!name || name.length < 2) return false;
  if (/^date:/i.test(name)) return false;
  if (/^referee/i.test(name)) return false;
  if (/^media/i.test(name)) return false;
  if (/^match$/i.test(name)) return false;
  if (/^round\b/i.test(name)) return false;
  if (/^losers?\b/i.test(name)) return false;
  if (isScoreToken(name)) return false;
  if (/^(na|eu|as)\s+round/i.test(name)) return false;
  return true;
}

export function parseMasterScheduleTab(
  csv: string,
  region: SheetRegion,
  phase: "qualifiers" | "playoffs",
  fallbackYear: number,
): { games: ParsedGame[]; warnings: string[] } {
  const rows = parseCsv(csv);
  const warnings: string[] = [];
  const games: ParsedGame[] = [];

  if (phase === "qualifiers") {
    let round = "Round 1";
    for (const row of rows) {
      const first = cell(row, 0);
      if (/round/i.test(first) && !isScoreToken(first)) {
        round = displayName(first) || round;
      }

      // Layout: [round?], team1, score1, score2, team2, date, time, ...
      let team1Idx = -1;
      for (let index = 0; index < row.length - 3; index += 1) {
        const t1 = cell(row, index);
        const s1 = cell(row, index + 1);
        const s2 = cell(row, index + 2);
        const t2 = cell(row, index + 3);
        if (looksLikeTeam(t1) && isScoreToken(s1) && isScoreToken(s2) && looksLikeTeam(t2)) {
          team1Idx = index;
          break;
        }
      }
      if (team1Idx < 0) continue;

      const team1Name = displayName(cell(row, team1Idx));
      const team2Name = displayName(cell(row, team1Idx + 3));
      const team1Score = Number.parseInt(cell(row, team1Idx + 1), 10);
      const team2Score = Number.parseInt(cell(row, team1Idx + 2), 10);
      const dateRaw = cell(row, team1Idx + 4);
      const rest = row.slice(team1Idx + 5).map((value) => value.trim());
      const forfeit = rest.some((value) => /forfeit/i.test(value));
      const setScores = rest.filter((value) => /^\d+\s*-\s*-?\d+$/.test(value));
      const date = parseLooseDate(dateRaw, fallbackYear) ?? `${fallbackYear}-01-01`;

      if (/forfeit/i.test(dateRaw)) {
        warnings.push(`Forfeit game ${team1Name} vs ${team2Name} (${region} ${phase})`);
      }

      games.push({
        key: masterGameKey(region, phase, team1Name, team2Name, team1Score, team2Score, round),
        region,
        phase,
        round,
        date,
        team1Name,
        team2Name,
        team1Score: Number.isFinite(team1Score) ? team1Score : null,
        team2Score: Number.isFinite(team2Score) ? team2Score : null,
        setScores,
        forfeit,
      });
    }

    if (games.length === 0) {
      warnings.push(`No qualifier games parsed for ${region.toUpperCase()}`);
    }
    return { games, warnings };
  }

  // Playoffs: bracket cells — scan for adjacent team rows sharing score columns.
  let currentRound = "Playoffs";
  let currentDate = `${fallbackYear}-01-01`;

  for (let rowIndex = 0; rowIndex < rows.length - 1; rowIndex += 1) {
    const row = rows[rowIndex] ?? [];
    const next = rows[rowIndex + 1] ?? [];

    for (const value of row) {
      if (/^Date:/i.test(value.trim())) {
        currentDate = parseLooseDate(value, fallbackYear) ?? currentDate;
      }
      if (/round|finals|quarter|semi/i.test(value) && !isScoreToken(value)) {
        const label = displayName(value);
        if (label.length > 2 && label.length < 40) currentRound = label;
      }
    }

    for (let index = 0; index < Math.max(row.length, next.length); index += 1) {
      const top = cell(row, index);
      const bottom = cell(next, index);
      if (!looksLikeTeam(top) || !looksLikeTeam(bottom)) continue;

      // Collect set scores in following columns until non-score.
      const topScores: number[] = [];
      const bottomScores: number[] = [];
      for (let offset = 1; offset <= 5; offset += 1) {
        const a = cell(row, index + offset);
        const b = cell(next, index + offset);
        if (!isVolleyballSetScore(a) || !isVolleyballSetScore(b)) break;
        topScores.push(Number.parseInt(a, 10));
        bottomScores.push(Number.parseInt(b, 10));
      }
      if (topScores.length === 0) continue;

      // Skip placeholder / bye scores like -1/-2 or 0/0 with no real match energy if both zeroish
      const meaningful = topScores.some((score, i) => Math.abs(score) > 0 || Math.abs(bottomScores[i] ?? 0) > 0);
      if (!meaningful) continue;

      let team1Wins = 0;
      let team2Wins = 0;
      const setScores: string[] = [];
      for (let i = 0; i < topScores.length; i += 1) {
        const a = topScores[i] ?? 0;
        const b = bottomScores[i] ?? 0;
        if (a < 0 || b < 0) continue;
        setScores.push(`${a} - ${b}`);
        if (a > b) team1Wins += 1;
        else if (b > a) team2Wins += 1;
      }

      if (team1Wins === 0 && team2Wins === 0) continue;

      const team1Name = displayName(top);
      const team2Name = displayName(bottom);
      games.push({
        key: masterGameKey(region, phase, team1Name, team2Name, team1Wins, team2Wins, `${currentRound}@${index}`),
        region,
        phase,
        round: currentRound,
        date: currentDate,
        team1Name,
        team2Name,
        team1Score: team1Wins,
        team2Score: team2Wins,
        setScores,
        forfeit: topScores.every((score) => score <= 0) || bottomScores.every((score) => score <= 0),
      });
    }
  }

  // Deduplicate noisy bracket parses — keep the best-scoring row when teams+round repeat.
  const byPairRound = new Map<string, ParsedGame>();
  for (const game of games) {
    const pair = `${normalizeName(game.team1Name)}|${normalizeName(game.team2Name)}|${game.round}`;
    const existing = byPairRound.get(pair);
    if (!existing) {
      byPairRound.set(pair, game);
      continue;
    }
    const existingTotal = (existing.team1Score ?? 0) + (existing.team2Score ?? 0);
    const gameTotal = (game.team1Score ?? 0) + (game.team2Score ?? 0);
    if (gameTotal > existingTotal) byPairRound.set(pair, game);
  }
  const deduped = [...byPairRound.values()];

  if (deduped.length === 0) {
    warnings.push(`No playoff games parsed for ${region.toUpperCase()}`);
  }

  return { games: deduped, warnings };
}

export function parseMasterWorkbook(
  tabs: Map<string, string[]>,
  fallbackYear: number,
): { teams: ParsedTeam[]; games: ParsedGame[]; warnings: string[] } {
  const teams: ParsedTeam[] = [];
  const games: ParsedGame[] = [];
  const warnings: string[] = [];

  for (const [tabName, lines] of tabs) {
    const match = tabName.trim().match(REGION_TAB);
    if (!match?.[1] || !match[2]) continue;
    const region = regionFromCode(match[1]);
    const kind = match[2].toUpperCase();
    const csv = lines.join("\n");

    if (kind === "TEAMS") {
      const parsed = parseMasterTeamsTab(csv, region);
      teams.push(...parsed.teams);
      warnings.push(...parsed.warnings);
    } else if (kind === "QUALIFIERS") {
      const parsed = parseMasterScheduleTab(csv, region, "qualifiers", fallbackYear);
      games.push(...parsed.games);
      warnings.push(...parsed.warnings);
    } else if (kind === "PLAYOFFS") {
      const parsed = parseMasterScheduleTab(csv, region, "playoffs", fallbackYear);
      games.push(...parsed.games);
      warnings.push(...parsed.warnings);
    }
  }

  return { teams, games, warnings };
}

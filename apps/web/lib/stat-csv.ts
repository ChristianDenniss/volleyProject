export interface ParsedStatRow {
  playerName: string;
  spikeKills?: number;
  spikeAttempts?: number;
  spikingErrors?: number;
  apeKills?: number;
  apeAttempts?: number;
  assists?: number;
  settingErrors?: number;
  blocks?: number;
  blockFollows?: number;
  digs?: number;
  aces?: number;
  servingErrors?: number;
  miscErrors?: number;
}

const COLUMN_ALIASES: Record<string, keyof ParsedStatRow> = {
  player: "playerName",
  playername: "playerName",
  name: "playerName",
  spikekills: "spikeKills",
  kills: "spikeKills",
  spikeattempts: "spikeAttempts",
  attempts: "spikeAttempts",
  spikeerrors: "spikingErrors",
  spikingerrors: "spikingErrors",
  apekills: "apeKills",
  apeattempts: "apeAttempts",
  assists: "assists",
  settingerrors: "settingErrors",
  seterrors: "settingErrors",
  blocks: "blocks",
  blockfollows: "blockFollows",
  digs: "digs",
  aces: "aces",
  servingerrors: "servingErrors",
  serveerrors: "servingErrors",
  miscerrors: "miscErrors",
};

function splitRow(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"') {
      if (quoted && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
      continue;
    }
    if (character === "," && !quoted) {
      cells.push(current.trim());
      current = "";
      continue;
    }
    current += character;
  }

  cells.push(current.trim());
  return cells;
}

function normalizeHeader(value: string): keyof ParsedStatRow | null {
  const key = value.toLowerCase().replace(/[^a-z]/g, "");
  return COLUMN_ALIASES[key] ?? null;
}

export function parseStatCsv(input: string): ParsedStatRow[] {
  const lines = input
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length < 2) return [];

  const headers = splitRow(lines[0] ?? "").map(normalizeHeader);
  if (!headers.includes("playerName")) {
    throw new Error("The CSV needs a player column");
  }

  const rows: ParsedStatRow[] = [];

  for (const line of lines.slice(1)) {
    const cells = splitRow(line);
    const row: ParsedStatRow = { playerName: "" };

    headers.forEach((header, index) => {
      if (!header) return;
      const cell = cells[index] ?? "";
      if (header === "playerName") {
        row.playerName = cell;
        return;
      }
      const parsed = Number.parseInt(cell, 10);
      if (Number.isFinite(parsed)) row[header] = parsed;
    });

    if (row.playerName !== "") rows.push(row);
  }

  return rows;
}

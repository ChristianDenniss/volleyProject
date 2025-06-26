import { CSVGameData, CSVStatsData } from "../types/interfaces";

export interface ParsedCSVData {
  gameData: Partial<CSVGameData>;
  statsData: CSVStatsData[];
  teamNames: string[];
  seasonId: number;
}

export function parseCSV(csvText: string): ParsedCSVData {
  const lines = csvText.trim().split(/\r?\n/);
  let seasonId: number | null = null;
  let teamNames: string[] = [];
  let currentTeam: string | null = null;
  let foundFirstTeam = false;
  let foundSecondTeam = false;
  let statsData: CSVStatsData[] = [];

  // Find season number
  for (const line of lines) {
    if (line.toLowerCase().startsWith("season:")) {
      const match = line.match(/season:\s*(\d+)/i);
      if (match) {
        seasonId = parseInt(match[1], 10);
      }
      break;
    }
  }
  if (!seasonId) {
    throw new Error("Could not find season number in the CSV (e.g., 'SEASON: 5')");
  }

  // Find team names and player rows
  for (let i = 0; i < lines.length; i++) {
    const row = lines[i].split(",").map(cell => cell.trim());
    const firstCell = row[0];
    // Skip header and empty rows
    if (!firstCell || firstCell.toLowerCase().startsWith("season") || firstCell.toLowerCase().startsWith("sets") || firstCell.toLowerCase().startsWith("spiking errors") || firstCell.toLowerCase().startsWith("spikes")) {
      continue;
    }
    // If this is a team name row (not a player row)
    if (!foundFirstTeam) {
      currentTeam = firstCell;
      teamNames.push(currentTeam.toLowerCase());
      foundFirstTeam = true;
      continue;
    }
    // If we hit a new team name (after first team block)
    if (foundFirstTeam && !foundSecondTeam && firstCell && row.slice(1).every(cell => cell === "")) {
      currentTeam = firstCell;
      teamNames.push(currentTeam.toLowerCase());
      foundSecondTeam = true;
      continue;
    }
    // If this is a player row (first cell is not empty, not a header, and not a team name row)
    if (currentTeam && firstCell && row.length >= 14 && row.slice(1).some(cell => cell !== "")) {
      // Strict mapping for stat fields
      statsData.push({
        playerName: firstCell,
        spikingErrors: parseInt(row[1]) || 0,
        apeKills: parseInt(row[2]) || 0,
        apeAttempts: parseInt(row[3]) || 0,
        spikeKills: parseInt(row[4]) || 0,
        spikeAttempts: parseInt(row[5]) || 0,
        blocks: parseInt(row[6]) || 0,
        assists: parseInt(row[7]) || 0,
        digs: parseInt(row[8]) || 0,
        blockFollows: parseInt(row[9]) || 0,
        aces: parseInt(row[10]) || 0,
        miscErrors: parseInt(row[11]) || 0,
        settingErrors: parseInt(row[12]) || 0,
        servingErrors: parseInt(row[13]) || 0,
      });
    }
  }

  if (teamNames.length !== 2) {
    throw new Error("Could not find exactly two team names in the CSV");
  }
  if (statsData.length === 0) {
    throw new Error("No player stats found in the CSV");
  }

  return {
    gameData: {
      teamNames,
      seasonId,
    },
    statsData,
    teamNames,
    seasonId,
  };
}

export function generateCSVTemplate(): string {
  return `SEASON: 5,Spikes,,,,,Blocks,Sets,Recieves,,Serves,,Errors,
Sets: 0 - 0,Spiking Errors,Ape Kills,Ape Attempts,Kills,Attempts,Total,Assists,Spike,BFs,Aces,Misc. Errors,Set. Errors,Serve Errors
Yoru,,,,,,,,,,,,,
m_ochii3,0,0,0,0,0,0,0,0,0,0,0,0,0
xavier200iqq,0,0,0,0,0,0,0,0,0,0,0,0,0
Reaper,,,,,,,,,,,,,
braynnrr,0,0,0,0,0,0,0,0,0,0,0,0,0`;
} 
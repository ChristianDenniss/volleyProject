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
  let team1Score: number | null = null;
  let team2Score: number | null = null;

  // Find season number and sets score
  for (const line of lines) {
    if (line.toLowerCase().startsWith("season:")) {
      const match = line.match(/season:\s*(\d+)/i);
      if (match) {
        seasonId = parseInt(match[1].trim(), 10);
      }
    }
    
    // Find sets score in format "Sets: # - #" or "Score: # - # [additional text]"
    const trimmedLine = line.trim();
    if (trimmedLine.toLowerCase().startsWith("sets:") || trimmedLine.toLowerCase().startsWith("score:")) {
      // More robust regex: allow spaces before/after colon
      const setsMatch = trimmedLine.match(/(?:sets|score)\s*:\s*(\d+)\s*-\s*(\d+)/i);
      if (setsMatch) {
        const score1 = parseInt(setsMatch[1].trim(), 10);
        const score2 = parseInt(setsMatch[2].trim(), 10);
        
        // Validation for set scores
        if (score1 < 0 || score2 < 0) {
          throw new Error("Set scores cannot be negative. All scores must be 0 or positive.");
        }
        
        if (score1 === 0 && score2 === 0) {
          throw new Error("Set scores cannot be 0 for both teams. At least one team must have a score above 0.");
        }
        
        if (score1 === score2) {
          throw new Error("Set scores cannot be tied. One team must win the match.");
        }
        
        // At least one score must be 2 or above
        if (score1 < 2 && score2 < 2) {
          throw new Error("At least one team score must be 2 or above for a valid match result.");
        }
        
        team1Score = score1;
        team2Score = score2;
      }
    }
  }
  
  if (!seasonId) {
    throw new Error("Could not find season number in the CSV (e.g., 'SEASON: 5')");
  }
  
  if (team1Score === null || team2Score === null) {
    throw new Error("Could not find sets score in the CSV (e.g., 'Sets: 3 - 1' or 'Score: 2 - 0')");
  }

  // Find team names and player rows
  for (let i = 0; i < lines.length; i++) {
    const row = lines[i].split(",").map(cell => cell.trim());
    const firstCell = row[0];
    // Skip header and empty rows
    if (!firstCell || firstCell.toLowerCase().startsWith("season") || firstCell.toLowerCase().startsWith("sets") || firstCell.toLowerCase().startsWith("score") || firstCell.toLowerCase().startsWith("spiking errors") || firstCell.toLowerCase().startsWith("spikes")) {
      continue;
    }
    // If this is a team name row (not a player row)
    if (!foundFirstTeam) {
      currentTeam = firstCell;
      teamNames.push(currentTeam.trim().toLowerCase());
      foundFirstTeam = true;
      continue;
    }
    // If we hit a new team name (after first team block)
    if (foundFirstTeam && !foundSecondTeam && firstCell && row.slice(1).every(cell => cell === "")) {
      currentTeam = firstCell;
      teamNames.push(currentTeam.trim().toLowerCase());
      foundSecondTeam = true;
      continue;
    }
    // If this is a player row (first cell is not empty, not a header, and not a team name row)
    if (currentTeam && firstCell && row.length >= 14 && row.slice(1).some(cell => cell !== "")) {
      // Strict mapping for stat fields
      const statValues = [
        parseInt(row[1]) || 0, // spikingErrors
        parseInt(row[2]) || 0, // apeKills
        parseInt(row[3]) || 0, // apeAttempts
        parseInt(row[4]) || 0, // spikeKills
        parseInt(row[5]) || 0, // spikeAttempts
        parseInt(row[6]) || 0, // blocks
        parseInt(row[7]) || 0, // assists
        parseInt(row[8]) || 0, // digs
        parseInt(row[9]) || 0, // blockFollows
        parseInt(row[10]) || 0, // aces
        parseInt(row[11]) || 0, // miscErrors
        parseInt(row[12]) || 0, // settingErrors
        parseInt(row[13]) || 0, // servingErrors
      ];
      // Only add if at least one stat is non-zero
      if (statValues.some(val => val !== 0)) {
        statsData.push({
          playerName: firstCell.toLowerCase(),
          spikingErrors: statValues[0],
          apeKills: statValues[1],
          apeAttempts: statValues[2],
          spikeKills: statValues[3],
          spikeAttempts: statValues[4],
          blocks: statValues[5],
          assists: statValues[6],
          digs: statValues[7],
          blockFollows: statValues[8],
          aces: statValues[9],
          miscErrors: statValues[10],
          settingErrors: statValues[11],
          servingErrors: statValues[12],
        });
      }
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
      team1Score,
      team2Score,
    },
    statsData,
    teamNames,
    seasonId,
  };
}

export function generateCSVTemplate(): string {
  return `SEASON: 5,Spikes,,,,,Blocks,Sets,Recieves,,Serves,,Errors,
Score: 3 - 1,Spiking Errors,Ape Kills,Ape Attempts,Kills,Attempts,Total,Assists,Spike,BFs,Aces,Misc. Errors,Set. Errors,Serve Errors
Yoru,,,,,,,,,,,,,
m_ochii3,0,0,0,0,0,0,0,0,0,0,0,0,0
xavier200iqq,0,0,0,0,0,0,0,0,0,0,0,0,0
Reaper,,,,,,,,,,,,,
braynnrr,0,0,0,0,0,0,0,0,0,0,0,0,0`;
} 
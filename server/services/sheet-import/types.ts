import type { GamePhase, GameRegion } from "../games";
import type { TeamLeadershipRole } from "@db/schema";

export type SheetImportMode = "full" | "teams" | "teams_and_players" | "players";

export type SheetRegion = Extract<GameRegion, "na" | "eu" | "as">;

export type { TeamLeadershipRole };

export interface SheetStatCounts {
  spikeKills: number;
  spikeAttempts: number;
  spikingErrors: number;
  apeKills: number;
  apeAttempts: number;
  assists: number;
  settingErrors: number;
  blocks: number;
  blockFollows: number;
  digs: number;
  aces: number;
  servingErrors: number;
  miscErrors: number;
}

export interface ParsedTeam {
  name: string;
  region: SheetRegion | null;
  playerNames: string[];
  /** Header-adjacent captains: first = C, second = VC, third = CC. */
  leadership?: Partial<Record<TeamLeadershipRole, string>> | undefined;
}

export interface ParsedGame {
  key: string;
  region: SheetRegion;
  phase: GamePhase;
  round: string;
  date: string;
  team1Name: string;
  team2Name: string;
  team1Score: number | null;
  team2Score: number | null;
  setScores: string[];
  forfeit: boolean;
}

export interface ParsedStatRow extends SheetStatCounts {
  playerName: string;
}

export interface ParsedScoreBlock {
  teamName: string;
  region: SheetRegion;
  winnerName: string;
  teamScore: number;
  opponentScore: number;
  rows: ParsedStatRow[];
}

export interface PreviewTeam {
  key: string;
  name: string;
  region: SheetRegion | null;
  playerNames: string[];
  leadership?: Partial<Record<TeamLeadershipRole, string>>;
  included: boolean;
}

export interface PreviewPlayer {
  name: string;
  teamName: string;
  exists: boolean;
}

export interface PreviewGame {
  key: string;
  region: SheetRegion;
  phase: GamePhase;
  round: string;
  date: string;
  team1Name: string;
  team2Name: string;
  team1Score: number | null;
  team2Score: number | null;
  setScores: string[];
  forfeit: boolean;
  matchedStatCount: number;
  included: boolean;
}

export interface PreviewStat {
  gameKey: string;
  teamName: string;
  playerName: string;
  counts: SheetStatCounts;
}

export interface SheetImportCounts {
  teams: number;
  players: number;
  playersNew: number;
  playersExisting: number;
  games: number;
  stats: number;
  warnings: number;
  errors: number;
}

export interface SheetImportPreview {
  mode: SheetImportMode;
  seasonNumber: number | null;
  seasonId: number | null;
  counts: SheetImportCounts;
  teams: PreviewTeam[];
  players: PreviewPlayer[];
  games: PreviewGame[];
  stats: PreviewStat[];
  warnings: string[];
  errors: string[];
}

export interface SheetImportCommitResult {
  seasonId: number;
  seasonNumber: number;
  teamsCreated: number;
  playersCreated: number;
  playersAttached: number;
  gamesCreated: number;
  statsCreated: number;
  warnings: string[];
}

export interface RegionalUrls {
  na?: string | undefined;
  eu?: string | undefined;
  as?: string | undefined;
}

export interface AssembledSources {
  masterTeams: ParsedTeam[];
  masterGames: ParsedGame[];
  regionalTeams: ParsedTeam[];
  regionalBlocks: ParsedScoreBlock[];
  sourceWarnings: string[];
}

export interface SheetImportInput {
  mode: SheetImportMode;
  masterUrl?: string | undefined;
  regionalUrls?: RegionalUrls | undefined;
  sources?: AssembledSources | undefined;
  seasonNumber?: number | undefined;
  seasonId?: number | undefined;
  startDate?: string | undefined;
  endDate?: string | null | undefined;
  theme?: string | null | undefined;
  excludeTeamKeys?: string[] | undefined;
  excludeGameKeys?: string[] | undefined;
}

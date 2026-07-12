import type { Game } from "../types/interfaces";

export const QUALIFIER_STAGES = [
  "Round 1",
  "Round 2",
  "Round 3",
  "Round 4",
  "Round 5",
  "Round 6",
] as const;

export const PLAYOFF_STAGES = [
  "Round 1",
  "Round 2",
  "Round 3",
  "Round of 16",
  "Quarterfinals",
  "Semifinals",
  "Finals",
  "Grand Finals",
  "Bracket Reset",
  "3rd Place Match",
] as const;

export const PRE_SEASON_STAGES = [
  "Exhibition",
  "Scrimmage",
] as const;

export function getStageOptionsForPhase(phase: Game["phase"] | undefined): readonly string[] {
  switch (phase) {
    case "pre_season":
      return PRE_SEASON_STAGES;
    case "playoffs":
      return PLAYOFF_STAGES;
    case "qualifiers":
    default:
      return QUALIFIER_STAGES;
  }
}

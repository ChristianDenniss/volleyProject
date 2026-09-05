import { normalizeName } from "./names";
import type { SheetRegion } from "./types";

/** Stable import key for master schedule games (matches parse-master). */
export function masterGameKey(
  region: SheetRegion,
  phase: string,
  team1: string,
  team2: string,
  score1: number | null,
  score2: number | null,
  round: string,
): string {
  const a = normalizeName(team1);
  const b = normalizeName(team2);
  const [left, right] = a < b ? [a, b] : [b, a];
  const [sLeft, sRight] =
    a < b ? [score1 ?? "x", score2 ?? "x"] : [score2 ?? "x", score1 ?? "x"];
  return `${region}|${phase}|${round}|${left}|${right}|${sLeft}-${sRight}`;
}

/** Stable import key for synthetic games created from unmatched stat blocks. */
export function syntheticGameKey(
  region: SheetRegion,
  team1: string,
  team2: string,
  score1: number,
  score2: number,
): string {
  const left = normalizeName(team1);
  const right = normalizeName(team2);
  const [a, b] = left < right ? [left, right] : [right, left];
  const [sLeft, sRight] =
    left < right ? [score1, score2] : [score2, score1];
  return `${region}|stats|${a}|${b}|${sLeft}-${sRight}`;
}

/** Reconstruct the import key for a row already stored in D1. */
export function importKeyFromStoredGame(input: {
  region: SheetRegion;
  phase: string;
  round: string;
  date: string;
  team1Name: string;
  team2Name: string;
  team1Score: number | null;
  team2Score: number | null;
}): string {
  if (input.round === "From stats sheet" && input.date === "1970-01-01") {
    if (input.team1Score == null || input.team2Score == null) {
      return masterGameKey(
        input.region,
        input.phase,
        input.team1Name,
        input.team2Name,
        input.team1Score,
        input.team2Score,
        input.round,
      );
    }
    return syntheticGameKey(
      input.region,
      input.team1Name,
      input.team2Name,
      input.team1Score,
      input.team2Score,
    );
  }
  return masterGameKey(
    input.region,
    input.phase,
    input.team1Name,
    input.team2Name,
    input.team1Score,
    input.team2Score,
    input.round,
  );
}

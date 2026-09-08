export type StageRound = "R1" | "R2" | "R3" | "R4" | "R5" | "R6" | "all";

type StageKey = { stage: string; bracket?: "winners" | "losers" };

export const STAGE_ROUNDS: Record<StageRound, StageKey[]> = {
  R1: [{ stage: "Round of 16", bracket: "winners" }],
  R2: [
    { stage: "Quarter", bracket: "winners" },
    { stage: "Round 1", bracket: "losers" },
  ],
  R3: [
    { stage: "Semi", bracket: "winners" },
    { stage: "Round 2", bracket: "losers" },
  ],
  R4: [
    { stage: "Finals", bracket: "winners" },
    { stage: "Round 3", bracket: "losers" },
    { stage: "Quarter", bracket: "losers" },
  ],
  R5: [
    { stage: "Semi", bracket: "losers" },
    { stage: "Finals", bracket: "losers" },
  ],
  R6: [{ stage: "Grand Finals" }, { stage: "Bracket Reset" }],
  all: [],
};

export const STAGE_ROUND_OPTIONS: { value: StageRound; label: string }[] = [
  { value: "all", label: "All rounds" },
  { value: "R1", label: "R1 — Winners Round of 16" },
  { value: "R2", label: "R2 — Winners QF + Losers R1" },
  { value: "R3", label: "R3 — Winners SF + Losers R2" },
  { value: "R4", label: "R4 — Winners Finals + Losers R3/QF" },
  { value: "R5", label: "R5 — Losers SF + Losers Finals" },
  { value: "R6", label: "R6 — Grand Finals" },
];

export function isStageRound(value: string): value is StageRound {
  return value in STAGE_ROUNDS;
}

/** Match `games.stage` text like "Winners Bracket; Round of 16". */
export function stageMatchesRound(stage: string, key: StageKey): boolean {
  const normalized = stage.toLowerCase();
  if (!normalized.includes(key.stage.toLowerCase())) return false;
  if (key.bracket === "winners") return normalized.includes("winners");
  if (key.bracket === "losers") return normalized.includes("losers");
  return true;
}

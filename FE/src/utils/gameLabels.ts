/**
 * Display helpers for game phase / stage / bracket.
 * Stage is a clean round label; bracket is a separate field.
 */

type GameStageFields = {
  stage?: string | null;
  bracket?: "winners" | "losers" | null;
  phase?: "qualifiers" | "playoffs" | "pre_season" | string | null;
};

export function formatGameStage(game: GameStageFields): string {
  const stage = game.stage?.trim();
  if (!stage) return "—";

  if (game.bracket === "winners") return `Winners · ${stage}`;
  if (game.bracket === "losers") return `Losers · ${stage}`;
  return stage;
}

export function formatGamePhase(phase?: string | null): string {
  switch (phase) {
    case "pre_season":
      return "Pre-Season";
    case "qualifiers":
      return "Qualifiers";
    case "playoffs":
      return "Playoffs";
    default:
      return phase ?? "—";
  }
}

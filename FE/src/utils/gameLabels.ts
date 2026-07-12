/**
 * Display helpers for game phase / stage / bracket.
 * Stage stores the round label; phase and bracket are separate fields.
 */

type GameStageFields = {
  stage?: string | null;
  bracket?: "winners" | "losers" | null;
  phase?: "qualifiers" | "playoffs" | "pre_season" | string | null;
};

const BRACKET_LABELS = {
  winners: "Winners Bracket",
  losers: "Losers Bracket",
} as const;

const QUALIFIER_LABEL = "Qualifiers";

function normalizeQualifierRound(stage: string | undefined): string {
  if (!stage || stage.toLowerCase() === "regular season") {
    return "Round 1";
  }
  return stage;
}

export function formatGameStage(game: GameStageFields): string {
  let stage = game.stage?.trim();

  if (stage?.toLowerCase() === "winners") stage = BRACKET_LABELS.winners;
  if (stage?.toLowerCase() === "losers") stage = BRACKET_LABELS.losers;

  if (game.bracket === "winners") {
    if (!stage) return BRACKET_LABELS.winners;
    if (stage.toLowerCase().includes("winners bracket")) return stage;
    return `${BRACKET_LABELS.winners} · ${stage}`;
  }

  if (game.bracket === "losers") {
    if (!stage) return BRACKET_LABELS.losers;
    if (stage.toLowerCase().includes("losers bracket")) return stage;
    return `${BRACKET_LABELS.losers} · ${stage}`;
  }

  if (game.phase === "qualifiers" || (!game.phase && stage?.toLowerCase() === "regular season")) {
    return `${QUALIFIER_LABEL} · ${normalizeQualifierRound(stage)}`;
  }

  if (game.phase === "pre_season") {
    if (!stage) return "Pre-Season";
    if (stage.toLowerCase().startsWith("pre-season")) return stage;
    return `Pre-Season · ${stage}`;
  }

  if (!stage) return "—";
  return stage;
}

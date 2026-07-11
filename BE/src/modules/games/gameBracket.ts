import { GameBracket, GamePhase } from './game.entity.js';

export function inferBracketFromStage(stage: string): GameBracket | null {
    const lower = stage.toLowerCase();
    if (lower.includes('losers bracket')) return GameBracket.LOSERS;
    if (lower.includes('winners bracket')) return GameBracket.WINNERS;
    return null;
}

export interface BracketResolutionInput {
    stage: string;
    phase: GamePhase;
    explicitBracket?: GameBracket | null;
    challongeRound?: number | null;
    tournamentType?: string;
    identifier?: string | null;
}

/**
 * Resolves bracket for a game. Explicit API value wins; otherwise infer from
 * stage text, then Challonge double-elim round sign.
 */
export function resolveGameBracket(input: BracketResolutionInput): GameBracket | null {
    if (input.explicitBracket !== undefined) {
        return input.explicitBracket;
    }

    if (input.phase !== GamePhase.PLAYOFFS) {
        return null;
    }

    const fromStage = inferBracketFromStage(input.stage);
    if (fromStage) {
        return fromStage;
    }

    const tournamentType = (input.tournamentType ?? '').toLowerCase();
    if (
        input.challongeRound != null &&
        tournamentType.includes('double elimination') &&
        input.identifier !== 'GF' &&
        input.identifier !== 'GF1' &&
        input.identifier !== 'GF2'
    ) {
        return input.challongeRound < 0 ? GameBracket.LOSERS : GameBracket.WINNERS;
    }

    return null;
}

export function inferBracketFromChallonge(input: {
    round: number;
    tournamentType: string;
    identifier?: string | null;
    phase: GamePhase;
    stage: string;
}): GameBracket | null {
    return resolveGameBracket({
        stage: input.stage,
        phase: input.phase,
        challongeRound: input.round,
        tournamentType: input.tournamentType,
        identifier: input.identifier,
    });
}

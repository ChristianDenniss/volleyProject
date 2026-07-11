import { GamePhase, GameRegion } from './game.entity.js';

export interface StageMappingInput {
    tournamentType: string;
    tournamentName: string;
    round: number;
    groupId?: number | null;
    identifier?: string | null;
    phase: GamePhase;
    region: GameRegion;
}

export function parseRegionFromTournamentName(name: string): GameRegion | null {
    const match = name.match(/\[(NA|EU|AS|SA)\]/i);
    if (!match) return null;
    return match[1].toLowerCase() as GameRegion;
}

export function mapChallongeToStage(input: StageMappingInput): { stage: string; round: string } {
    const roundLabel = `Round ${input.round}`;

    if (input.groupId != null) {
        return { stage: `Group Stage; ${roundLabel}`, round: roundLabel };
    }

    const tournamentType = (input.tournamentType ?? '').toLowerCase();

    if (tournamentType.includes('swiss') || input.phase === GamePhase.QUALIFIERS) {
        return { stage: `Qualifiers; ${roundLabel}`, round: roundLabel };
    }

    if (input.identifier === 'GF' || input.identifier === 'GF1') {
        return { stage: 'Grand Finals', round: roundLabel };
    }
    if (input.identifier === 'GF2') {
        return { stage: 'Grand Finals; Bracket Reset', round: roundLabel };
    }

    if (tournamentType.includes('single elimination')) {
        return { stage: mapSingleElimStage(input.round), round: roundLabel };
    }

    if (tournamentType.includes('double elimination')) {
        if (input.round < 0) {
            return { stage: `Losers Bracket; Round ${Math.abs(input.round)}`, round: roundLabel };
        }
        return { stage: mapWinnersBracketStage(input.round), round: roundLabel };
    }

    return { stage: roundLabel, round: roundLabel };
}

function mapSingleElimStage(round: number): string {
    const depthNames: Record<number, string> = {
        1: 'Single Elimination; Finals',
        2: 'Single Elimination; Semifinals',
        3: 'Single Elimination; Quarterfinals',
        4: 'Single Elimination; Round of 16',
    };
    return depthNames[round] ?? `Single Elimination; Round ${round}`;
}

function mapWinnersBracketStage(round: number): string {
    const depthNames: Record<number, string> = {
        1: 'Winners Bracket; Finals',
        2: 'Winners Bracket; Semifinals',
        3: 'Winners Bracket; Quarterfinals',
        4: 'Winners Bracket; Round of 16',
    };
    return depthNames[round] ?? `Winners Bracket; Round ${round}`;
}

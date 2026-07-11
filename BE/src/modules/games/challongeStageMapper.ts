import { GamePhase } from './game.entity.js';
import { RegionCode } from '../regions/region.entity.js';

export interface StageMappingInput {
    tournamentType: string;
    tournamentName: string;
    round: number;
    groupId?: number | null;
    identifier?: string | null;
    phase: GamePhase;
    region: RegionCode;
}

export function parseRegionFromTournamentName(name: string): RegionCode | null {
    const match = name.match(/\[(NA|EU|AS)\]/i);
    if (!match) return null;
    return match[1].toLowerCase() as RegionCode;
}

export function mapChallongeToStage(input: StageMappingInput): string {
    const roundLabel = `Round ${input.round}`;

    if (input.groupId != null) {
        return roundLabel;
    }

    const tournamentType = (input.tournamentType ?? '').toLowerCase();

    if (input.phase === GamePhase.PRE_SEASON) {
        return roundLabel;
    }

    if (tournamentType.includes('swiss') || input.phase === GamePhase.QUALIFIERS) {
        return roundLabel;
    }

    if (input.identifier === 'GF' || input.identifier === 'GF1') {
        return 'Grand Finals';
    }
    if (input.identifier === 'GF2') {
        return 'Bracket Reset';
    }

    if (tournamentType.includes('single elimination')) {
        return mapEliminationDepth(input.round);
    }

    if (tournamentType.includes('double elimination')) {
        if (input.round < 0) {
            return mapLosersDepth(Math.abs(input.round));
        }
        return mapEliminationDepth(input.round);
    }

    return roundLabel;
}

function mapEliminationDepth(round: number): string {
    const depthNames: Record<number, string> = {
        1: 'Finals',
        2: 'Semifinals',
        3: 'Quarterfinals',
        4: 'Round of 16',
    };
    return depthNames[round] ?? `Round ${round}`;
}

function mapLosersDepth(round: number): string {
    const depthNames: Record<number, string> = {
        1: 'Round 1',
        2: 'Round 2',
        3: 'Round 3',
        4: 'Quarterfinals',
        5: 'Semifinals',
        6: 'Finals',
    };
    return depthNames[round] ?? `Round ${round}`;
}

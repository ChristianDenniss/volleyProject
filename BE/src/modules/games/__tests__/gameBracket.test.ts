import { describe, it, expect } from '@jest/globals';
import { inferBracketFromStage, resolveGameBracket, inferBracketFromChallonge } from '../utils/gameBracket.js';
import { GameBracket, GamePhase } from '../game.entity.js';

describe('inferBracketFromStage', () => {
    it('reads the losers bracket out of the stage label', () => {
        expect(inferBracketFromStage('Losers Bracket Round 3')).toBe(GameBracket.LOSERS);
    });

    it('reads the winners bracket out of the stage label', () => {
        expect(inferBracketFromStage('Winners Bracket Final')).toBe(GameBracket.WINNERS);
    });

    it('matches regardless of casing', () => {
        expect(inferBracketFromStage('LOSERS BRACKET R1')).toBe(GameBracket.LOSERS);
    });

    it('returns null for a stage that names no bracket', () => {
        expect(inferBracketFromStage('Grand Finals')).toBeNull();
    });
});

describe('resolveGameBracket', () => {
    const playoffs = { stage: 'Round 1', phase: GamePhase.PLAYOFFS };

    it('lets an explicit bracket win over everything else', () => {
        expect(
            resolveGameBracket({ stage: 'Losers Bracket R1', phase: GamePhase.PLAYOFFS, explicitBracket: GameBracket.WINNERS })
        ).toBe(GameBracket.WINNERS);
    });

    it('honours an explicit null as "no bracket"', () => {
        expect(
            resolveGameBracket({ stage: 'Losers Bracket R1', phase: GamePhase.PLAYOFFS, explicitBracket: null })
        ).toBeNull();
    });

    it('assigns no bracket outside the playoffs', () => {
        expect(resolveGameBracket({ stage: 'Losers Bracket R1', phase: GamePhase.QUALIFIERS })).toBeNull();
    });

    it('falls back to the stage label inside the playoffs', () => {
        expect(resolveGameBracket({ stage: 'Losers Bracket R1', phase: GamePhase.PLAYOFFS })).toBe(GameBracket.LOSERS);
    });

    it('reads a negative challonge round as the losers bracket', () => {
        expect(
            resolveGameBracket({ ...playoffs, challongeRound: -2, tournamentType: 'double elimination' })
        ).toBe(GameBracket.LOSERS);
    });

    it('reads a positive challonge round as the winners bracket', () => {
        expect(
            resolveGameBracket({ ...playoffs, challongeRound: 2, tournamentType: 'double elimination' })
        ).toBe(GameBracket.WINNERS);
    });

    it('ignores the challonge round for a single-elimination tournament', () => {
        expect(
            resolveGameBracket({ ...playoffs, challongeRound: -2, tournamentType: 'single elimination' })
        ).toBeNull();
    });

    it.each(['GF', 'GF1', 'GF2'])('leaves the grand final (%s) bracketless', identifier => {
        expect(
            resolveGameBracket({ ...playoffs, challongeRound: -1, tournamentType: 'double elimination', identifier })
        ).toBeNull();
    });

    it('returns null when there is nothing to go on', () => {
        expect(resolveGameBracket(playoffs)).toBeNull();
    });
});

describe('inferBracketFromChallonge', () => {
    it('delegates to the same rules as resolveGameBracket', () => {
        expect(
            inferBracketFromChallonge({
                round: -3,
                tournamentType: 'Double Elimination',
                phase: GamePhase.PLAYOFFS,
                stage: 'Round 3',
            })
        ).toBe(GameBracket.LOSERS);
    });

    it('still defers to an explicit bracket in the stage text', () => {
        expect(
            inferBracketFromChallonge({
                round: 3,
                tournamentType: 'Double Elimination',
                phase: GamePhase.PLAYOFFS,
                stage: 'Losers Bracket Round 3',
            })
        ).toBe(GameBracket.LOSERS);
    });
});

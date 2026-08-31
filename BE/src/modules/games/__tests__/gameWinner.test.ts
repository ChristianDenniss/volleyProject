import { describe, it, expect } from '@jest/globals';
import { resolveWinnerTeamId, resolveWinnerTeam, applyWinnerToGame, orderTeamsByIds } from '../gameWinner.js';

const TEAM_ONE = { id: 1, name: 'One' } as any;
const TEAM_TWO = { id: 2, name: 'Two' } as any;

describe('resolveWinnerTeamId', () => {
    it('picks the first team when it scored higher', () => {
        expect(resolveWinnerTeamId(3, 1, 1, 2)).toBe(1);
    });

    it('picks the second team when it scored higher', () => {
        expect(resolveWinnerTeamId(1, 3, 1, 2)).toBe(2);
    });

    it('returns null for a draw', () => {
        expect(resolveWinnerTeamId(2, 2, 1, 2)).toBeNull();
    });

    it('returns null when either score is missing', () => {
        expect(resolveWinnerTeamId(null, 3, 1, 2)).toBeNull();
        expect(resolveWinnerTeamId(3, null, 1, 2)).toBeNull();
    });

    it('returns null when either score is undefined', () => {
        expect(resolveWinnerTeamId(undefined, 3, 1, 2)).toBeNull();
    });

    it('returns null when a team id is missing, even with a decisive score', () => {
        expect(resolveWinnerTeamId(3, 1, null, 2)).toBeNull();
        expect(resolveWinnerTeamId(3, 1, 1, null)).toBeNull();
    });

    it('treats 0-0 as a draw rather than a missing score', () => {
        expect(resolveWinnerTeamId(0, 0, 1, 2)).toBeNull();
    });

    it('handles a shutout win', () => {
        expect(resolveWinnerTeamId(3, 0, 1, 2)).toBe(1);
    });
});

describe('resolveWinnerTeam', () => {
    it('returns the winning team entity', () => {
        expect(resolveWinnerTeam(3, 1, [TEAM_ONE, TEAM_TWO])).toBe(TEAM_ONE);
    });

    it('returns the second team when it wins', () => {
        expect(resolveWinnerTeam(1, 3, [TEAM_ONE, TEAM_TWO])).toBe(TEAM_TWO);
    });

    it('returns null when there are no teams', () => {
        expect(resolveWinnerTeam(3, 1, [])).toBeNull();
    });

    it('returns null when the team list is undefined', () => {
        expect(resolveWinnerTeam(3, 1, undefined)).toBeNull();
    });

    it('returns null when only one team is present', () => {
        expect(resolveWinnerTeam(3, 1, [TEAM_ONE])).toBeNull();
    });

    it('ignores teams past the first two', () => {
        expect(resolveWinnerTeam(1, 3, [TEAM_ONE, TEAM_TWO, { id: 3 } as any])).toBe(TEAM_TWO);
    });
});

describe('applyWinnerToGame', () => {
    it('writes both the winner entity and its id onto the game', () => {
        const game: any = { team1Score: 3, team2Score: 1, teams: [TEAM_ONE, TEAM_TWO] };

        applyWinnerToGame(game);

        expect(game.winner).toBe(TEAM_ONE);
        expect(game.winnerTeamId).toBe(1);
    });

    it('clears a previously recorded winner when the game becomes undecided', () => {
        const game: any = {
            team1Score: null,
            team2Score: null,
            teams: [TEAM_ONE, TEAM_TWO],
            winner: TEAM_ONE,
            winnerTeamId: 1,
        };

        applyWinnerToGame(game);

        expect(game.winner).toBeNull();
        expect(game.winnerTeamId).toBeNull();
    });

    it('clears the winner on a draw', () => {
        const game: any = { team1Score: 2, team2Score: 2, teams: [TEAM_ONE, TEAM_TWO], winnerTeamId: 1 };

        applyWinnerToGame(game);

        expect(game.winnerTeamId).toBeNull();
    });
});

describe('orderTeamsByIds', () => {
    it('reorders the fetched teams to match the requested id order', () => {
        expect(orderTeamsByIds([2, 1], [TEAM_ONE, TEAM_TWO])).toEqual([TEAM_TWO, TEAM_ONE]);
    });

    it('keeps an order that already matches', () => {
        expect(orderTeamsByIds([1, 2], [TEAM_ONE, TEAM_TWO])).toEqual([TEAM_ONE, TEAM_TWO]);
    });

    it('throws when an id has no matching team', () => {
        expect(() => orderTeamsByIds([1, 99], [TEAM_ONE, TEAM_TWO])).toThrow('Team with ID 99 not found');
    });

    it('returns an empty list for no ids', () => {
        expect(orderTeamsByIds([], [TEAM_ONE])).toEqual([]);
    });
});

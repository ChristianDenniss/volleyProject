import {
    buildPlayerLeaderboardSql,
    buildTeamLeaderboardSql,
    countParamsFrom,
    parseLeaderboardFilters,
    LEADERBOARD_DEFAULT_SORT,
} from '../stat.leaderboard.js';
import type { LeaderboardParams } from '../stat.leaderboard.js';

function baseParams(overrides: Partial<LeaderboardParams> = {}): LeaderboardParams {
    return {
        view: 'player',
        statType: 'total',
        sortBy: LEADERBOARD_DEFAULT_SORT,
        sortDir: 'DESC',
        filters: [],
        pagination: { page: 1, limit: 25, skip: 0, take: 25 },
        ...overrides,
    };
}

describe('stat.leaderboard SQL builders', () => {
    it('parseLeaderboardFilters validates whitelist and operators', () => {
        expect(parseLeaderboardFilters('not-json')).toEqual([]);
        expect(parseLeaderboardFilters([
            { stat: 'totalKills', operator: '>', value: 10 },
            { stat: 'dropTable', operator: '>', value: 1 },
            { stat: 'Spike%', operator: '==', value: 0.5 },
            { stat: 'blocks', operator: 'OR 1=1', value: 1 },
        ])).toEqual([
            { stat: 'totalKills', operator: '>', value: 10 },
            { stat: 'Spike%', operator: '==', value: 0.5 },
        ]);
    });

    it('buildPlayerLeaderboardSql parameterizes filters and orders by whitelisted column', () => {
        const { sql, countSql, queryParams } = buildPlayerLeaderboardSql(baseParams({
            seasonNumber: 5,
            search: 'Alex',
            regionId: 1,
            stageRound: 'R1',
            sortBy: 'totalKills',
            sortDir: 'DESC',
            filters: [{ stat: 'blocks', operator: '>=', value: 3 }],
            statType: 'perGame',
        }));

        expect(sql).toContain('ORDER BY sub."totalKills" DESC');
        expect(sql).toContain('LIMIT');
        expect(sql).toContain('agg."gamesPlayed"');
        expect(sql).toContain("g.stage = $");
        expect(sql).not.toContain('dropTable');
        expect(countSql).not.toContain('LIMIT');
        // season, search, region, stage stage, stage bracket, filter value, limit, offset
        expect(queryParams).toEqual([5, '%Alex%', 1, 'Round of 16', 'winners', 3, 25, 0]);
        expect(countParamsFrom(queryParams)).toEqual([5, '%Alex%', 1, 'Round of 16', 'winners', 3]);
    });

    it('buildTeamLeaderboardSql joins teams_games for game-scoped attribution', () => {
        const { sql } = buildTeamLeaderboardSql(baseParams({ view: 'team', sortBy: 'name', sortDir: 'ASC' }));
        expect(sql).toContain('players_teams_teams');
        expect(sql).toContain('teams_games');
        expect(sql).toContain('ORDER BY sub.name ASC');
    });

    it('ratio columns are not divided for perSet normalization', () => {
        const { sql } = buildPlayerLeaderboardSql(baseParams({ statType: 'perSet', sortBy: 'Spike%' }));
        // Spike% should come through as agg."Spike%" (ratio), not divided by totalSets
        expect(sql).toMatch(/agg\."Spike%" AS "Spike%"/);
        expect(sql).toContain('ORDER BY sub."Spike%"');
    });
});

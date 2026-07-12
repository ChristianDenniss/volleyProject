/**
 * Playoff stage-round buckets used by the stats leaderboard.
 * Mirrored on the FE in StatsLeaderboard.tsx — keep both in sync.
 */
export type StageRound = 'R1' | 'R2' | 'R3' | 'R4' | 'R5' | 'R6' | 'all';

export type StageKey = { stage: string; bracket?: 'winners' | 'losers' };

export const STAGE_ROUNDS: Record<StageRound, StageKey[]> = {
    R1: [{ stage: 'Round of 16', bracket: 'winners' }],
    R2: [
        { stage: 'Quarterfinals', bracket: 'winners' },
        { stage: 'Round 1', bracket: 'losers' },
    ],
    R3: [
        { stage: 'Semifinals', bracket: 'winners' },
        { stage: 'Round 2', bracket: 'losers' },
    ],
    R4: [
        { stage: 'Finals', bracket: 'winners' },
        { stage: 'Round 3', bracket: 'losers' },
        { stage: 'Quarterfinals', bracket: 'losers' },
    ],
    R5: [
        { stage: 'Semifinals', bracket: 'losers' },
        { stage: 'Finals', bracket: 'losers' },
    ],
    R6: [
        { stage: 'Grand Finals' },
        { stage: 'Bracket Reset' },
    ],
    all: [],
};

export const STAGE_ROUND_KEYS = ['R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'all'] as const;

/**
 * Build a parameterized SQL fragment matching games in a stage-round bucket.
 * Returns { sql, params } where sql is empty when round is 'all' / unrecognized.
 */
export function buildStageRoundSql(
    stageRound: StageRound | undefined,
    gamesAlias: string,
    paramOffset: number
): { sql: string; params: unknown[]; nextOffset: number } {
    if (!stageRound || stageRound === 'all') {
        return { sql: '', params: [], nextOffset: paramOffset };
    }
    const keys = STAGE_ROUNDS[stageRound];
    if (!keys || keys.length === 0) {
        return { sql: '', params: [], nextOffset: paramOffset };
    }

    const params: unknown[] = [];
    let offset = paramOffset;
    const clauses = keys.map((key) => {
        const stageParam = `$${offset++}`;
        params.push(key.stage);
        if (key.bracket === undefined) {
            return `(${gamesAlias}.stage = ${stageParam})`;
        }
        const bracketParam = `$${offset++}`;
        params.push(key.bracket);
        return `(${gamesAlias}.stage = ${stageParam} AND ${gamesAlias}.bracket = ${bracketParam})`;
    });

    return {
        sql: `AND (${clauses.join(' OR ')})`,
        params,
        nextOffset: offset,
    };
}

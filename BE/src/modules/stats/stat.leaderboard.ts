import { PaginationParams, SortDir } from '../../utils/pagination.js';
import { StageRound, buildStageRoundSql } from '../games/stageRounds.js';

/** Exact keys the FE sends for sortBy / advanced filters (including % suffixes). */
export const LEADERBOARD_STAT_FIELDS = [
    'spikeKills',
    'spikeAttempts',
    'Spike%',
    'apeKills',
    'apeAttempts',
    'Ape%',
    'totalKills',
    'totalAttempts',
    'totalSpike%',
    'spikingErrors',
    'blocks',
    'assists',
    'settingErrors',
    'digs',
    'blockFollows',
    'totalReceives',
    'aces',
    'servingErrors',
    'PRF',
    'plusMinus',
    'totalErrors',
    'miscErrors',
] as const;

export type LeaderboardStatField = typeof LEADERBOARD_STAT_FIELDS[number];
export const LEADERBOARD_SORT_FIELDS = ['name', ...LEADERBOARD_STAT_FIELDS] as const;
export type LeaderboardSortField = typeof LEADERBOARD_SORT_FIELDS[number];
export const LEADERBOARD_DEFAULT_SORT: LeaderboardSortField = 'totalKills';

export type LeaderboardView = 'player' | 'team';
export type LeaderboardStatType = 'total' | 'perGame' | 'perSet';
export type FilterOp = '==' | '!=' | '>' | '>=' | '<' | '<=';

export interface LeaderboardFilterCondition {
    stat: LeaderboardStatField;
    operator: FilterOp;
    value: number;
}

export interface LeaderboardParams {
    view: LeaderboardView;
    seasonNumber?: number;
    stageRound?: StageRound;
    statType: LeaderboardStatType;
    search?: string;
    regionId?: number;
    sortBy: LeaderboardSortField;
    sortDir: SortDir;
    filters: LeaderboardFilterCondition[];
    pagination: PaginationParams;
}

const RATIO_FIELDS = new Set<LeaderboardStatField>(['Spike%', 'Ape%', 'totalSpike%']);

const FILTER_OP_SQL: Record<FilterOp, string> = {
    '==': '=',
    '!=': '<>',
    '>': '>',
    '>=': '>=',
    '<': '<',
    '<=': '<=',
};

/** Aggregation expressions inside the GROUP BY subquery (pre-normalization). */
const AGG_EXPR: Record<LeaderboardStatField, string> = {
    spikeKills: 'SUM(s."spikeKills")',
    spikeAttempts: 'SUM(s."spikeAttempts")',
    apeKills: 'SUM(s."apeKills")',
    apeAttempts: 'SUM(s."apeAttempts")',
    spikingErrors: 'SUM(s."spikingErrors")',
    digs: 'SUM(s."digs")',
    blocks: 'SUM(s."blocks")',
    assists: 'SUM(s."assists")',
    aces: 'SUM(s."aces")',
    settingErrors: 'SUM(s."settingErrors")',
    blockFollows: 'SUM(s."blockFollows")',
    servingErrors: 'SUM(s."servingErrors")',
    miscErrors: 'SUM(s."miscErrors")',
    totalKills: 'SUM(s."apeKills" + s."spikeKills")',
    totalAttempts: 'SUM(s."apeAttempts" + s."spikeAttempts")',
    totalReceives: 'SUM(s."digs" + s."blockFollows")',
    PRF: 'SUM(s."apeKills" + s."spikeKills" + s."aces" + s."assists")',
    totalErrors: 'SUM(s."miscErrors" + s."spikingErrors" + s."settingErrors" + s."servingErrors")',
    plusMinus:
        'SUM(s."apeKills" + s."spikeKills" + s."aces" + s."assists") - SUM(s."miscErrors" + s."spikingErrors" + s."settingErrors" + s."servingErrors")',
    'Spike%':
        `CASE WHEN SUM(s."spikeAttempts") = 0 THEN 0 ELSE SUM(s."spikeKills")::float / SUM(s."spikeAttempts") END`,
    'Ape%':
        `CASE WHEN SUM(s."apeAttempts") = 0 THEN 0 ELSE SUM(s."apeKills")::float / SUM(s."apeAttempts") END`,
    'totalSpike%':
        `CASE WHEN SUM(s."apeAttempts" + s."spikeAttempts") = 0 THEN 0 ELSE SUM(s."apeKills" + s."spikeKills")::float / SUM(s."apeAttempts" + s."spikeAttempts") END`,
};

function quoteIdent(field: string): string {
    return `"${field.replace(/"/g, '')}"`;
}

function normalizeExpr(field: LeaderboardStatField, statType: LeaderboardStatType): string {
    const alias = quoteIdent(field);
    if (RATIO_FIELDS.has(field) || statType === 'total') {
        return `agg.${alias}`;
    }
    if (statType === 'perGame') {
        return `CASE WHEN agg."gamesPlayed" = 0 THEN 0 ELSE agg.${alias}::float / agg."gamesPlayed" END`;
    }
    return `CASE WHEN agg."totalSets" = 0 THEN 0 ELSE agg.${alias}::float / agg."totalSets" END`;
}

function buildAggSelectList(): string {
    return LEADERBOARD_STAT_FIELDS
        .map((field) => `${AGG_EXPR[field]} AS ${quoteIdent(field)}`)
        .join(',\n        ');
}

function buildNormalizedSelectList(statType: LeaderboardStatType, view: LeaderboardView): string {
    const identity =
        view === 'player'
            ? 'agg.id, agg.name'
            : 'agg.id, agg.name, agg."logoUrl", agg."seasonNumber"';
    const stats = LEADERBOARD_STAT_FIELDS
        .map((field) => `${normalizeExpr(field, statType)} AS ${quoteIdent(field)}`)
        .join(',\n        ');
    return `${identity},\n        agg."gamesPlayed",\n        agg."totalSets",\n        ${stats}`;
}

function buildFilterWhere(
    filters: LeaderboardFilterCondition[],
    paramOffset: number
): { sql: string; params: unknown[]; nextOffset: number } {
    if (filters.length === 0) return { sql: '', params: [], nextOffset: paramOffset };

    const params: unknown[] = [];
    let offset = paramOffset;
    const clauses = filters.map((f) => {
        const op = FILTER_OP_SQL[f.operator];
        const param = `$${offset++}`;
        params.push(f.value);
        // Float equality: abs(diff) < 0.001, matching FE epsilon
        if (f.operator === '==') {
            return `ABS(sub.${quoteIdent(f.stat)} - ${param}) < 0.001`;
        }
        if (f.operator === '!=') {
            return `ABS(sub.${quoteIdent(f.stat)} - ${param}) >= 0.001`;
        }
        return `sub.${quoteIdent(f.stat)} ${op} ${param}`;
    });

    return {
        sql: `WHERE ${clauses.join(' AND ')}`,
        params,
        nextOffset: offset,
    };
}

export function isLeaderboardStatField(value: string): value is LeaderboardStatField {
    return (LEADERBOARD_STAT_FIELDS as readonly string[]).includes(value);
}

export function isFilterOp(value: string): value is FilterOp {
    return value in FILTER_OP_SQL;
}

export function parseLeaderboardFilters(raw: unknown): LeaderboardFilterCondition[] {
    if (raw == null || raw === '') return [];

    let parsed: unknown = raw;
    if (typeof raw === 'string') {
        try {
            parsed = JSON.parse(raw);
        } catch {
            return [];
        }
    }
    if (!Array.isArray(parsed)) return [];

    const out: LeaderboardFilterCondition[] = [];
    for (const item of parsed) {
        if (!item || typeof item !== 'object') continue;
        const stat = (item as { stat?: string }).stat;
        const operator = (item as { operator?: string }).operator;
        const value = Number((item as { value?: unknown }).value);
        if (!stat || !isLeaderboardStatField(stat)) continue;
        if (!operator || !isFilterOp(operator)) continue;
        if (!Number.isFinite(value)) continue;
        out.push({ stat, operator, value });
    }
    return out;
}

export function buildPlayerLeaderboardSql(params: LeaderboardParams): { sql: string; countSql: string; queryParams: unknown[] } {
    const queryParams: unknown[] = [];
    let offset = 1;

    const seasonParam = `$${offset++}`;
    queryParams.push(params.seasonNumber ?? null);

    const searchParam = `$${offset++}`;
    queryParams.push(params.search ? `%${params.search}%` : null);

    const regionParam = `$${offset++}`;
    queryParams.push(params.regionId ?? null);

    const stage = buildStageRoundSql(params.stageRound, 'g', offset);
    queryParams.push(...stage.params);
    offset = stage.nextOffset;

    const aggCols = buildAggSelectList();
    const normalizedCols = buildNormalizedSelectList(params.statType, 'player');

    const inner = `
      SELECT
        p.id,
        p.name,
        ${aggCols},
        COUNT(DISTINCT s."gameId") AS "gamesPlayed",
        SUM(COALESCE(g."team1Score", 0) + COALESCE(g."team2Score", 0)) AS "totalSets"
      FROM stats s
      JOIN players p ON p.id = s."playerId"
      JOIN games g ON g.id = s."gameId"
      JOIN seasons se ON se.id = g."seasonId"
      WHERE (${seasonParam}::int IS NULL OR se."seasonNumber" = ${seasonParam})
        AND (${searchParam}::text IS NULL OR p.name ILIKE ${searchParam})
        AND (${regionParam}::int IS NULL OR g."regionId" = ${regionParam})
        ${stage.sql}
      GROUP BY p.id, p.name
      HAVING SUM(s."spikeKills" + s."spikeAttempts" + s."apeKills" + s."apeAttempts"
        + s."spikingErrors" + s."digs" + s."blocks" + s."assists" + s."aces"
        + s."settingErrors" + s."blockFollows" + s."servingErrors" + s."miscErrors") > 0
    `;

    const filter = buildFilterWhere(params.filters, offset);
    queryParams.push(...filter.params);
    offset = filter.nextOffset;

    const sortCol =
        params.sortBy === 'name' ? 'sub.name' : `sub.${quoteIdent(params.sortBy)}`;
    const sortDir = params.sortDir === 'ASC' ? 'ASC' : 'DESC';

    const limitParam = `$${offset++}`;
    const offsetParam = `$${offset++}`;
    queryParams.push(params.pagination.take, params.pagination.skip);

    const wrapped = `
      SELECT * FROM (
        SELECT ${normalizedCols}
        FROM (${inner}) agg
      ) sub
      ${filter.sql}
      ORDER BY ${sortCol} ${sortDir} NULLS LAST, sub.name ASC
      LIMIT ${limitParam} OFFSET ${offsetParam}
    `;

    const countSql = `
      SELECT COUNT(*)::int AS count FROM (
        SELECT ${normalizedCols}
        FROM (${inner}) agg
      ) sub
      ${filter.sql}
    `;

    // Count query shares the same params except LIMIT/OFFSET — strip the last two.
    return {
        sql: wrapped,
        countSql,
        queryParams,
    };
}

export function buildTeamLeaderboardSql(params: LeaderboardParams): { sql: string; countSql: string; queryParams: unknown[] } {
    const queryParams: unknown[] = [];
    let offset = 1;

    const seasonParam = `$${offset++}`;
    queryParams.push(params.seasonNumber ?? null);

    const searchParam = `$${offset++}`;
    queryParams.push(params.search ? `%${params.search}%` : null);

    const regionParam = `$${offset++}`;
    queryParams.push(params.regionId ?? null);

    const stage = buildStageRoundSql(params.stageRound, 'g', offset);
    queryParams.push(...stage.params);
    offset = stage.nextOffset;

    const aggCols = buildAggSelectList();
    const normalizedCols = buildNormalizedSelectList(params.statType, 'team');

    // Join stats → player's teams → teams_games for the same game so we only
    // attribute a stat row to the team that actually played that game.
    // totalSets: sum of set scores over player-stat rows, divided by distinct
    // contributing players — mirrors the FE's "divide by roster size" correction.
    const inner = `
      SELECT
        t.id,
        t.name,
        t."logoUrl",
        se."seasonNumber",
        ${aggCols},
        COUNT(DISTINCT s."gameId") AS "gamesPlayed",
        CASE WHEN COUNT(DISTINCT s."playerId") = 0 THEN 0
             ELSE SUM(COALESCE(g."team1Score", 0) + COALESCE(g."team2Score", 0))::float
                  / COUNT(DISTINCT s."playerId")
        END AS "totalSets"
      FROM stats s
      JOIN players p ON p.id = s."playerId"
      JOIN games g ON g.id = s."gameId"
      JOIN seasons se ON se.id = g."seasonId"
      JOIN players_teams_teams pt ON pt."playersId" = s."playerId"
      JOIN teams_games tg ON tg."teamsId" = pt."teamsId" AND tg."gamesId" = s."gameId"
      JOIN teams t ON t.id = tg."teamsId"
      WHERE (${seasonParam}::int IS NULL OR se."seasonNumber" = ${seasonParam})
        AND (${searchParam}::text IS NULL OR t.name ILIKE ${searchParam})
        AND (${regionParam}::int IS NULL OR g."regionId" = ${regionParam})
        ${stage.sql}
      GROUP BY t.id, t.name, t."logoUrl", se."seasonNumber"
      HAVING SUM(s."spikeKills" + s."spikeAttempts" + s."apeKills" + s."apeAttempts"
        + s."spikingErrors" + s."digs" + s."blocks" + s."assists" + s."aces"
        + s."settingErrors" + s."blockFollows" + s."servingErrors" + s."miscErrors") > 0
    `;

    const filter = buildFilterWhere(params.filters, offset);
    queryParams.push(...filter.params);
    offset = filter.nextOffset;

    const sortCol =
        params.sortBy === 'name' ? 'sub.name' : `sub.${quoteIdent(params.sortBy)}`;
    const sortDir = params.sortDir === 'ASC' ? 'ASC' : 'DESC';

    const limitParam = `$${offset++}`;
    const offsetParam = `$${offset++}`;
    queryParams.push(params.pagination.take, params.pagination.skip);

    const wrapped = `
      SELECT * FROM (
        SELECT ${normalizedCols}
        FROM (${inner}) agg
      ) sub
      ${filter.sql}
      ORDER BY ${sortCol} ${sortDir} NULLS LAST, sub.name ASC
      LIMIT ${limitParam} OFFSET ${offsetParam}
    `;

    const countSql = `
      SELECT COUNT(*)::int AS count FROM (
        SELECT ${normalizedCols}
        FROM (${inner}) agg
      ) sub
      ${filter.sql}
    `;

    return { sql: wrapped, countSql, queryParams };
}

/** Params for the COUNT query share everything except the trailing LIMIT/OFFSET. */
export function countParamsFrom(queryParams: unknown[]): unknown[] {
    return queryParams.slice(0, -2);
}

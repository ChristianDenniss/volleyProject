import { Request } from 'express';

export interface PaginationParams {
    page: number;
    limit: number;
    skip: number;
    take: number;
}

export interface PaginatedResult<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

/**
 * Parse page/limit query params, clamping to sane bounds.
 * Missing or non-numeric values fall back to defaults rather than erroring,
 * matching the rest of this API's lenient query handling.
 */
export function parsePagination(query: Request['query'], defaultLimit: number, maxLimit = 100): PaginationParams {
    const rawPage = Number(query.page);
    const rawLimit = Number(query.limit);

    const page = Number.isFinite(rawPage) && rawPage >= 1 ? Math.floor(rawPage) : 1;
    const limit = Number.isFinite(rawLimit) && rawLimit >= 1
        ? Math.min(Math.floor(rawLimit), maxLimit)
        : defaultLimit;

    return {
        page,
        limit,
        skip: (page - 1) * limit,
        take: limit,
    };
}

export function toPaginatedResult<T>(data: T[], total: number, params: PaginationParams): PaginatedResult<T> {
    return {
        data,
        total,
        page: params.page,
        limit: params.limit,
        totalPages: Math.max(1, Math.ceil(total / params.limit)),
    };
}

export type SortDir = 'ASC' | 'DESC';

export interface SortParams<TKey extends string> {
    sortBy: TKey;
    sortDir: SortDir;
}

/**
 * Parse sortBy/sortDir query params against a whitelist of allowed field names.
 * An unrecognized or missing sortBy falls back to defaultKey rather than erroring,
 * so a bad value never turns into an arbitrary column/SQL reference downstream -
 * callers only ever see one of the values they explicitly whitelisted.
 * Missing/invalid sortDir falls back to defaultDir (DESC unless the endpoint opts into ASC).
 */
export function parseSort<TKey extends string>(
    query: Request['query'],
    allowed: readonly TKey[],
    defaultKey: TKey,
    defaultDir: SortDir = 'DESC'
): SortParams<TKey> {
    const rawSortBy = typeof query.sortBy === 'string' ? query.sortBy : undefined;
    const sortBy = (allowed as readonly string[]).includes(rawSortBy ?? '')
        ? (rawSortBy as TKey)
        : defaultKey;

    const rawSortDir = typeof query.sortDir === 'string' ? query.sortDir.toUpperCase() : undefined;
    const sortDir: SortDir =
        rawSortDir === 'ASC' || rawSortDir === 'DESC' ? rawSortDir : defaultDir;

    return { sortBy, sortDir };
}

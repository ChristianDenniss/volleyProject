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

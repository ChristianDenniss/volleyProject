import { parsePagination, parseSort, toPaginatedResult } from '../pagination.js';

describe('parsePagination', () => {
    it('uses defaults when page/limit are missing or invalid', () => {
        expect(parsePagination({}, 25)).toEqual({
            page: 1,
            limit: 25,
            skip: 0,
            take: 25,
        });
        expect(parsePagination({ page: 'nope', limit: '-1' }, 10)).toEqual({
            page: 1,
            limit: 10,
            skip: 0,
            take: 10,
        });
    });

    it('clamps limit to maxLimit and floors page/limit', () => {
        expect(parsePagination({ page: '2.9', limit: '500' }, 25, 100)).toEqual({
            page: 2,
            limit: 100,
            skip: 100,
            take: 100,
        });
    });
});

describe('parseSort', () => {
    const allowed = ['name', 'createdAt'] as const;

    it('falls back to defaults for unknown or missing sort fields', () => {
        expect(parseSort({}, allowed, 'name')).toEqual({ sortBy: 'name', sortDir: 'DESC' });
        expect(parseSort({ sortBy: 'dropTable', sortDir: 'ASC' }, allowed, 'createdAt', 'ASC')).toEqual({
            sortBy: 'createdAt',
            sortDir: 'ASC',
        });
    });

    it('accepts whitelisted sortBy and ASC/DESC', () => {
        expect(parseSort({ sortBy: 'createdAt', sortDir: 'asc' }, allowed, 'name')).toEqual({
            sortBy: 'createdAt',
            sortDir: 'ASC',
        });
    });
});

describe('toPaginatedResult', () => {
    it('computes totalPages with a minimum of 1', () => {
        expect(toPaginatedResult([], 0, { page: 1, limit: 10, skip: 0, take: 10 })).toMatchObject({
            total: 0,
            totalPages: 1,
        });
        expect(toPaginatedResult([1, 2], 25, { page: 2, limit: 10, skip: 10, take: 10 })).toMatchObject({
            total: 25,
            page: 2,
            totalPages: 3,
        });
    });
});

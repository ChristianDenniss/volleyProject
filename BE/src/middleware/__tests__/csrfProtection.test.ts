import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { csrfProtection } from '../csrfProtection.js';
import { UnauthorizedError } from '../../errors/UnauthorizedError.js';
import { AUTH_COOKIE_NAME, CSRF_COOKIE_NAME } from '../authCookie.js';
import type { Request, Response, NextFunction } from 'express';

function mockReq(partial: Partial<Request> & { headers?: Record<string, string>; cookies?: Record<string, string> }): Request {
    const headers = partial.headers ?? {};
    return {
        method: 'POST',
        path: '/api/teams',
        cookies: {},
        header: (name: string) => headers[name] ?? headers[name.toLowerCase()],
        ...partial,
        headers,
    } as unknown as Request;
}

describe('csrfProtection', () => {
    const res = {} as Response;
    let next: jest.MockedFunction<NextFunction>;

    beforeEach(() => {
        next = jest.fn();
        process.env.NODE_ENV = 'development';
        delete process.env.CORS_ORIGINS;
    });

    it('allows safe methods without CSRF checks', () => {
        csrfProtection(mockReq({ method: 'GET' }), res, next);
        expect(next).toHaveBeenCalledWith();
    });

    it('allows exempt auth paths', () => {
        csrfProtection(mockReq({ method: 'POST', path: '/api/users/login' }), res, next);
        expect(next).toHaveBeenCalledWith();
    });

    it('allows bearer-only requests without auth cookie', () => {
        csrfProtection(
            mockReq({
                headers: { Authorization: 'Bearer abc' },
                cookies: {},
            }),
            res,
            next
        );
        expect(next).toHaveBeenCalledWith();
    });

    it('rejects disallowed Origin', () => {
        csrfProtection(
            mockReq({
                headers: { Origin: 'https://evil.example' },
                cookies: { [AUTH_COOKIE_NAME]: 'tok' },
            }),
            res,
            next
        );
        expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
        expect((next.mock.calls[0][0] as UnauthorizedError).message).toBe('Invalid request origin');
    });

    it('rejects missing or mismatched CSRF token', () => {
        csrfProtection(
            mockReq({
                headers: { Origin: 'http://localhost:5173' },
                cookies: { [AUTH_COOKIE_NAME]: 'tok', [CSRF_COOKIE_NAME]: 'cookie-token' },
            }),
            res,
            next
        );
        expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedError));
        expect((next.mock.calls[0][0] as UnauthorizedError).message).toBe('Invalid CSRF token');
    });

    it('allows matching CSRF cookie and header', () => {
        csrfProtection(
            mockReq({
                headers: {
                    Origin: 'http://localhost:5173',
                    'X-CSRF-Token': 'same-token',
                },
                cookies: {
                    [AUTH_COOKIE_NAME]: 'tok',
                    [CSRF_COOKIE_NAME]: 'same-token',
                },
            }),
            res,
            next
        );
        expect(next).toHaveBeenCalledWith();
    });
});

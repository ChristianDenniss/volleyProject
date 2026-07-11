import { z } from 'zod';

const ALLOWED_URL_PROTOCOLS = new Set(['http:', 'https:']);

function hasSafeProtocol(value: string): boolean {
    try {
        return ALLOWED_URL_PROTOCOLS.has(new URL(value).protocol);
    } catch {
        return false;
    }
}

export const httpUrlSchema = z.string().url().refine(hasSafeProtocol, {
    message: 'URL must use http or https',
});

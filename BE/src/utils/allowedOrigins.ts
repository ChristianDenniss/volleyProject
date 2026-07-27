const PRODUCTION_ORIGINS = ['https://volleyball4-2.com'];
const DEVELOPMENT_ORIGINS = [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:8080',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
    'http://127.0.0.1:8080',
];

/**
 * Origins allowed for CORS and CSRF checks.
 * Prefer CORS_ORIGINS (comma-separated) when set; otherwise use env defaults.
 */
export function getAllowedOrigins(): string[] {
    if (process.env.CORS_ORIGINS) {
        return process.env.CORS_ORIGINS.split(',').map((origin) => origin.trim()).filter(Boolean);
    }

    if (process.env.NODE_ENV === 'production') {
        return PRODUCTION_ORIGINS;
    }

    return [...PRODUCTION_ORIGINS, ...DEVELOPMENT_ORIGINS];
}

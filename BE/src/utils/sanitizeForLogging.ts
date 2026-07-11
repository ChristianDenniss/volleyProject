const SENSITIVE_KEYS = new Set([
    "password",
    "currentPassword",
    "newPassword",
    "confirmPassword",
    "token",
    "authorization",
    "api_key",
    "apiKey",
    "secret",
]);

export function sanitizeForLogging(value: unknown): unknown {
    if (value === null || value === undefined) {
        return value;
    }

    if (Array.isArray(value)) {
        return value.map((entry) => sanitizeForLogging(entry));
    }

    if (typeof value !== "object") {
        return value;
    }

    const sanitized: Record<string, unknown> = {};

    for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
        if (SENSITIVE_KEYS.has(key.toLowerCase())) {
            sanitized[key] = "[REDACTED]";
            continue;
        }

        sanitized[key] = sanitizeForLogging(entry);
    }

    return sanitized;
}

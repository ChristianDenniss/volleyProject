import { getCsrfToken, clearClientAuthState, isMockMode } from "../utils/authStorage";

/**
 * Authenticated fetch wrapper.
 * Uses httpOnly cookies in production and falls back to bearer tokens in MSW mock mode.
 */
export async function authFetch(
    input: RequestInfo,
    init: RequestInit = {},
    token?: string | null
): Promise<Response>
{
    const headers = new Headers(init.headers);
    headers.set("Content-Type", "application/json");

    const method = (init.method ?? "GET").toUpperCase();
    if (method !== "GET" && method !== "HEAD") {
        const csrfToken = getCsrfToken();
        if (csrfToken) {
            headers.set("X-CSRF-Token", csrfToken);
        }
    }

    if (isMockMode && token) {
        headers.set("Authorization", `Bearer ${token}`);
    }

    const response = await fetch(input, {
        ...init,
        headers,
        credentials: "include",
    });

    if (response.status === 401 && (token || !isMockMode)) {
        clearClientAuthState();
        if (window.location.pathname !== "/login") {
            window.location.href = "/login";
        }
    }

    return response;
}

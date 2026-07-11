const isMockMode = import.meta.env.DEV && import.meta.env.VITE_USE_MSW === "true";

export function getCsrfToken(): string | null {
    const match = document.cookie.match(/(?:^|; )csrf_token=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : null;
}

export function clearClientAuthState(): void {
    localStorage.removeItem("currentUser");
    if (isMockMode) {
        localStorage.removeItem("authToken_v2");
    }
}

export { isMockMode };

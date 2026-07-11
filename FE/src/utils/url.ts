const ALLOWED_URL_PROTOCOLS = new Set(["http:", "https:"]);

export function isSafeExternalUrl(url: string | null | undefined): url is string {
    if (!url) return false;
    try {
        return ALLOWED_URL_PROTOCOLS.has(new URL(url).protocol);
    } catch {
        return false;
    }
}

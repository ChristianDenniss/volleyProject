/** Reject off-site and protocol-relative paths for post-login redirects. */
export function safeInternalPath(next: string | undefined | null, fallback = "/"): string {
  if (!next) return fallback;
  if (!next.startsWith("/")) return fallback;
  if (next.startsWith("//")) return fallback;
  if (next.includes("\\")) return fallback;
  return next;
}

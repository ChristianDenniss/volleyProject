const memory = new Map<string, { count: number; resetAt: number }>();

function cacheStore(): Cache | null {
  try {
    if (typeof caches === "undefined") return null;
    const store = (caches as CacheStorage & { default?: Cache }).default;
    return store ?? null;
  } catch {
    return null;
  }
}

function requestFor(key: string) {
  return new Request(`https://volley.internal/rate-limit/${encodeURIComponent(key)}`);
}

export interface RateLimitConfig {
  limit: number;
  windowSeconds: number;
}

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
}

async function readCount(key: string): Promise<{ count: number; resetAt: number } | null> {
  const store = cacheStore();
  if (store) {
    const hit = await store.match(requestFor(key));
    if (hit) return (await hit.json()) as { count: number; resetAt: number };
  }
  const local = memory.get(key);
  if (!local) return null;
  if (local.resetAt <= Date.now()) {
    memory.delete(key);
    return null;
  }
  return local;
}

async function writeCount(key: string, value: { count: number; resetAt: number }, maxAgeSeconds: number) {
  memory.set(key, value);
  const store = cacheStore();
  if (!store) return;
  await store.put(
    requestFor(key),
    new Response(JSON.stringify(value), {
      headers: {
        "content-type": "application/json",
        "cache-control": `public, max-age=${maxAgeSeconds}`,
      },
    }),
  );
}

export async function checkRateLimit(
  key: string,
  config: RateLimitConfig,
): Promise<RateLimitResult> {
  const now = Date.now();
  const existing = await readCount(key);
  const resetAt = existing && existing.resetAt > now ? existing.resetAt : now + config.windowSeconds * 1000;
  const count = existing && existing.resetAt > now ? existing.count + 1 : 1;

  await writeCount(key, { count, resetAt }, config.windowSeconds);

  if (count > config.limit) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((resetAt - now) / 1000)),
    };
  }

  return { allowed: true, retryAfterSeconds: 0 };
}

export function clientRateLimitKey(request: Request, bucket: string): string {
  const ip =
    request.headers.get("CF-Connecting-IP") ??
    request.headers.get("X-Forwarded-For")?.split(",")[0]?.trim() ??
    "unknown";
  return `${bucket}:${ip}`;
}

export function apiRateLimitBucket(pathname: string): RateLimitConfig | null {
  if (pathname.startsWith("/api/auth")) {
    return { limit: 60, windowSeconds: 60 };
  }
  if (pathname.startsWith("/api/roblox/avatar")) {
    return { limit: 120, windowSeconds: 60 };
  }
  if (pathname.startsWith("/api/trpc")) {
    return { limit: 300, windowSeconds: 60 };
  }
  return null;
}

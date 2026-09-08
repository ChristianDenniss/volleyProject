const memory = new Map<string, { expiresAt: number; body: string }>();

export const CACHE_DOMAINS = [
  "players",
  "games",
  "teams",
  "records",
  "stats",
  "awards",
  "articles",
  "seasons",
  "home",
] as const;

export type CacheDomain = (typeof CACHE_DOMAINS)[number];

export const PUBLIC_CACHE_TTL = 300;
const GENERATION_TTL = 60 * 60 * 24 * 30;

function requestFor(key: string) {
  return new Request(key);
}

function cacheStore(): Cache | null {
  try {
    if (typeof caches === "undefined") return null;
    // Workers expose caches.default; the DOM CacheStorage type does not.
    const store = (caches as CacheStorage & { default?: Cache }).default;
    return store ?? null;
  } catch {
    return null;
  }
}

export async function cacheRead<T>(key: string): Promise<T | null> {
  const store = cacheStore();
  if (store) {
    const hit = await store.match(requestFor(key));
    if (hit) return (await hit.json()) as T;
  }

  const local = memory.get(key);
  if (!local) return null;
  if (local.expiresAt <= Date.now()) {
    memory.delete(key);
    return null;
  }
  return JSON.parse(local.body) as T;
}

export async function cacheWrite(key: string, value: unknown, maxAgeSeconds: number) {
  const body = JSON.stringify(value);
  memory.set(key, { expiresAt: Date.now() + maxAgeSeconds * 1000, body });

  const store = cacheStore();
  if (!store) return;
  await store.put(
    requestFor(key),
    new Response(body, {
      headers: {
        "content-type": "application/json",
        "cache-control": `public, max-age=${maxAgeSeconds}`,
      },
    }),
  );
}

export async function cacheDelete(key: string) {
  memory.delete(key);
  const store = cacheStore();
  if (!store) return;
  await store.delete(requestFor(key));
}

function generationKey(domain: CacheDomain): string {
  return `https://volley.internal/cache/generation/${domain}`;
}

export async function cacheGeneration(domain: CacheDomain): Promise<number> {
  return (await cacheRead<number>(generationKey(domain))) ?? 0;
}

export async function bumpCacheGeneration(domains: Iterable<CacheDomain>): Promise<void> {
  for (const domain of new Set(domains)) {
    await cacheWrite(generationKey(domain), (await cacheGeneration(domain)) + 1, GENERATION_TTL);
  }
}

export async function cached<T>(
  domain: CacheDomain,
  key: string,
  load: () => Promise<T>,
  maxAgeSeconds: number = PUBLIC_CACHE_TTL,
): Promise<T> {
  const generation = await cacheGeneration(domain);
  const fullKey = `https://volley.internal/cache/${domain}/${generation}/${key}`;

  const hit = await cacheRead<T>(fullKey);
  if (hit !== null) return hit;

  const value = await load();
  await cacheWrite(fullKey, value, maxAgeSeconds);
  return value;
}

export function cacheKeyOf(parts: readonly (string | number | null | undefined)[]): string {
  return parts.map((part) => encodeURIComponent(part ?? "")).join("/");
}

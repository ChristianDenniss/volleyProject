const memory = new Map<string, { expiresAt: number; body: string }>();

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

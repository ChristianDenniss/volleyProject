import { cached, cacheKeyOf, type CacheDomain } from "@server/cache";

export function cachedQuery<T>(
  domain: CacheDomain,
  parts: readonly (string | number | null | undefined)[],
  load: () => Promise<T>,
): Promise<T> {
  return cached(domain, cacheKeyOf(parts), load);
}

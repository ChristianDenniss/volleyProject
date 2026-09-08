import { revalidatePath } from "next/cache";
import { bumpCacheGeneration, CACHE_DOMAINS, type CacheDomain } from "@server/cache";
import { domainsForPath, pathHead } from "@server/cache-tags";
import { logError } from "@server/report";

async function purgeTags(domains: CacheDomain[], heads: string[]): Promise<void> {
  const tags = [
    ...domains.map((domain) => `domain:${domain}`),
    ...heads.filter((head) => head !== "").map((head) => `page:${head}`),
  ];
  if (tags.length === 0) return;

  try {
    const { cache } = await import("cloudflare:workers");
    const result = await cache?.purge({ tags });
    if (result && !result.success) {
      logError("cache.purge", new Error("purge reported failure"), { tags, errors: result.errors });
    }
  } catch (error) {
    logError("cache.purge", error, { tags });
  }
}

export function revalidate(...paths: string[]): void {
  for (const path of paths) {
    revalidatePath(path);
  }

  const domains = [...new Set(paths.flatMap(domainsForPath))];
  const heads = [...new Set(paths.map(pathHead))];

  if (domains.length > 0) void bumpCacheGeneration(domains);
  void purgeTags(domains, heads);
}

export function revalidateAll(): void {
  void bumpCacheGeneration(CACHE_DOMAINS);
  void purgeTags([...CACHE_DOMAINS], []);
}

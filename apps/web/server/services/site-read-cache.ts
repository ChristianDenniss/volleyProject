import { cacheDelete, cacheRead, cacheWrite } from "../cache";

export const SITE_READ_TTL = 60 * 60 * 24;
const GENERATION_KEY = "https://volley.internal/cache/site-reads-generation";
const LEGACY_HOME_NUMBERS_KEY = "https://volley.internal/cache/home-numbers-season-v4";
const LEGACY_HOME_NUMBERS_GENERATION_KEY = "https://volley.internal/cache/home-numbers-generation";

export async function siteReadGeneration(): Promise<number> {
  const cached = await cacheRead<number>(GENERATION_KEY);
  return cached ?? 0;
}

export async function invalidateSiteReads() {
  const nextGeneration = (await siteReadGeneration()) + 1;
  await cacheWrite(GENERATION_KEY, nextGeneration, SITE_READ_TTL * 30);
  await cacheDelete(LEGACY_HOME_NUMBERS_KEY);
  await cacheDelete(LEGACY_HOME_NUMBERS_GENERATION_KEY);
}

export function siteReadKey(
  name: string,
  generation: number,
  ...parts: Array<string | number | boolean | null | undefined>
): string {
  const suffix = parts.map((part) => (part == null || part === "" ? "all" : String(part))).join("/");
  return `https://volley.internal/cache/${name}/v1/${generation}/${suffix}`;
}

export async function cachedSiteRead<T>(
  name: string,
  parts: Array<string | number | boolean | null | undefined>,
  load: () => Promise<T>,
): Promise<T> {
  const generation = await siteReadGeneration();
  const key = siteReadKey(name, generation, ...parts);
  const cached = await cacheRead<T>(key);
  if (cached !== null) return cached;
  const value = await load();
  await cacheWrite(key, value, SITE_READ_TTL);
  return value;
}

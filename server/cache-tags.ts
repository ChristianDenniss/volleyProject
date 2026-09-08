import type { CacheDomain } from "./cache";

export const PATH_DOMAINS: Record<string, CacheDomain[]> = {
  "": ["home", "games", "teams", "articles", "seasons", "players"],
  players: ["players", "home"],
  games: ["games", "home"],
  teams: ["teams", "home"],
  records: ["records", "home"],
  stats: ["stats", "records", "home"],
  awards: ["awards"],
  articles: ["articles", "home"],
  seasons: ["seasons", "home"],
  schedules: ["games"],
  "vector-graph": ["stats"],
};

const PUBLIC_PREFIXES = new Set(Object.keys(PATH_DOMAINS));

export function pathHead(path: string): string {
  const segments = path.split("/").filter((segment) => segment !== "");
  const head = segments[0] === "portal" ? segments[1] : segments[0];
  return head ?? "";
}

export function domainsForPath(path: string): CacheDomain[] {
  return PATH_DOMAINS[pathHead(path)] ?? [];
}

export function isCacheablePath(path: string): boolean {
  if (path.startsWith("/portal") || path.startsWith("/api") || path.startsWith("/_next")) {
    return false;
  }
  return PUBLIC_PREFIXES.has(pathHead(path));
}

export function cacheTagsForPath(path: string): string[] {
  const head = pathHead(path);
  const tags = domainsForPath(path).map((domain) => `domain:${domain}`);
  return head === "" ? tags : [...tags, `page:${head}`];
}

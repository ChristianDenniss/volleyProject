import { cacheTagsForPath, isCacheablePath } from "./cache-tags";

const SESSION_COOKIE = "better-auth.session_token";

export const RESPONSE_CACHE_TTL = 300;
export const RESPONSE_STALE_TTL = 600;

function hasSession(request: Request): boolean {
  return request.headers.get("cookie")?.includes(`${SESSION_COOKIE}=`) ?? false;
}

export function shouldCacheResponse(request: Request, response: Response): boolean {
  if (request.method !== "GET" && request.method !== "HEAD") return false;
  if (response.status !== 200) return false;
  if (response.headers.has("set-cookie")) return false;
  if (hasSession(request)) return false;
  return isCacheablePath(new URL(request.url).pathname);
}

export function applyResponseCache(request: Request, response: Response): Response {
  const path = new URL(request.url).pathname;
  if (!isCacheablePath(path)) return response;

  const headers = new Headers(response.headers);

  if (shouldCacheResponse(request, response)) {
    headers.set(
      "cache-control",
      `public, max-age=0, s-maxage=${RESPONSE_CACHE_TTL}, stale-while-revalidate=${RESPONSE_STALE_TTL}`,
    );
    headers.set("cache-tag", cacheTagsForPath(path).join(","));
  } else {
    headers.set("cache-control", "private, no-store");
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

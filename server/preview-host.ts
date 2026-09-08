const WORKERS_DEV_SUFFIX = ".workers.dev";
const PRODUCTION_WORKER = "volley-project";

export function isWorkersDevHost(hostname: string): boolean {
  return hostname.endsWith(WORKERS_DEV_SUFFIX);
}

export function isBareProductionHost(hostname: string): boolean {
  if (!isWorkersDevHost(hostname)) return false;
  const label = hostname.slice(0, -WORKERS_DEV_SUFFIX.length).split(".")[0];
  return label === PRODUCTION_WORKER;
}

export function canonicalRedirect(request: Request, canonicalOrigin: string | undefined): Response | null {
  if (!canonicalOrigin) return null;

  const url = new URL(request.url);
  if (!isBareProductionHost(url.hostname)) return null;

  const target = new URL(url.pathname + url.search, canonicalOrigin);
  return Response.redirect(target.toString(), 301);
}

export function applyPreviewHeaders(request: Request, response: Response): Response {
  if (!isWorkersDevHost(new URL(request.url).hostname)) return response;

  const headers = new Headers(response.headers);
  headers.set("x-robots-tag", "noindex, nofollow");
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

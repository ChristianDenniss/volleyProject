import handler from "vinext/server/fetch-handler";
import { withQueryStats } from "@db";
import { errorDetail, presentUnknownError } from "@/lib/error-presentation";
import { canonicalOrigin } from "./environment";
import { errorHtmlResponse, errorJsonResponse } from "./error-html";
import { handleRecordsBatch, type RecordsJobMessage } from "./queue";
import { handleUploadsBatch, UPLOADS_QUEUE } from "./upload-queue";
import { logError } from "./report";
import { apiRateLimitBucket, checkRateLimit, clientRateLimitKey } from "./rate-limit";
import { applyPreviewHeaders, canonicalRedirect } from "./preview-host";
import { applyResponseCache } from "./response-cache";
import { applySecurityHeaders } from "./security-headers";
function acceptsHtml(request: Request): boolean {
  const path = new URL(request.url).pathname;
  if (path.startsWith("/api/") || path.startsWith("/_next/")) return false;
  const accept = request.headers.get("Accept") ?? "";
  return accept.includes("text/html") || (request.method === "GET" && !accept.includes("application/json"));
}

function looksBranded(body: string): boolean {
  return body.includes("Sorry about that") || body.includes("rvlLogo.png") || body.includes("Refresh");
}

async function maybeBrandErrorResponse(
  request: Request,
  response: Response,
  error?: unknown,
): Promise<Response> {
  if (response.status < 500 || !acceptsHtml(request)) return response;

  const body = await response.clone().text();
  if (looksBranded(body)) return response;

  const presentation = error
    ? presentUnknownError(error)
    : presentUnknownError(new Error(`HTTP ${response.status}`));
  return errorHtmlResponse(
    presentation,
    error ? errorDetail(error) : body.trim() || null,
    response.status,
  );
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    return withQueryStats(
      "fetch",
      { method: request.method, path: new URL(request.url).pathname },
      () => serve(request, env, ctx),
    );
  },

  async queue(batch: MessageBatch<RecordsJobMessage>, env: Env): Promise<void> {
    await withQueryStats("queue", { queue: batch.queue, messages: batch.messages.length }, () =>
      batch.queue === UPLOADS_QUEUE
        ? handleUploadsBatch(batch as unknown as MessageBatch<unknown>, env)
        : handleRecordsBatch(batch, env),
    );
  },
} satisfies ExportedHandler<Env, RecordsJobMessage>;

async function serve(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  try {
    const canonical = canonicalRedirect(request, canonicalOrigin());
    if (canonical) return canonical;

    const pathname = new URL(request.url).pathname;
    const limitConfig = apiRateLimitBucket(pathname);
    if (limitConfig) {
      const bucket = pathname.startsWith("/api/auth") || pathname.startsWith("/api/login")
        ? "auth"
        : pathname.startsWith("/api/roblox/avatar")
          ? "roblox"
          : "trpc";
      const result = await checkRateLimit(clientRateLimitKey(request, bucket), limitConfig);
      if (!result.allowed) {
        return Response.json(
          { error: "Too many requests. Try again shortly." },
          {
            status: 429,
            headers: { "Retry-After": String(result.retryAfterSeconds) },
          },
        );
      }
    }

    const response = await handler.fetch(request, env, ctx);
    const branded = await maybeBrandErrorResponse(request, response);
    return applyPreviewHeaders(request, applySecurityHeaders(applyResponseCache(request, branded)));
  } catch (error) {
    logError("worker.fetch", error, {
      method: request.method,
      path: new URL(request.url).pathname,
    });

    const presentation = presentUnknownError(error);
    if (acceptsHtml(request)) {
      return applySecurityHeaders(errorHtmlResponse(presentation, errorDetail(error), 500));
    }
    return applySecurityHeaders(errorJsonResponse(presentation, 500));
  }
}

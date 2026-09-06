import handler from "vinext/server/fetch-handler";
import { errorDetail, presentUnknownError } from "@/lib/error-presentation";
import { errorHtmlResponse, errorJsonResponse } from "./error-html";
import { handleRecordsBatch, type RecordsJobMessage } from "./queue";
import { logError } from "./report";

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
    try {
      const response = await handler.fetch(request, env, ctx);
      return await maybeBrandErrorResponse(request, response);
    } catch (error) {
      logError("worker.fetch", error, {
        method: request.method,
        path: new URL(request.url).pathname,
      });

      const presentation = presentUnknownError(error);
      if (acceptsHtml(request)) {
        return errorHtmlResponse(presentation, errorDetail(error), 500);
      }
      return errorJsonResponse(presentation, 500);
    }
  },

  async queue(batch: MessageBatch<RecordsJobMessage>, env: Env): Promise<void> {
    await handleRecordsBatch(batch, env);
  },
} satisfies ExportedHandler<Env, RecordsJobMessage>;

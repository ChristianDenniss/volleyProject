import { STATUS_MESSAGES } from "./statusMessages";

/** The JSON body the BE's errorHandler sends: `{ error }`, plus `{ message, errors }` on a
 *  BadRequestError with field-level detail. A few older middlewares send `{ message }` alone. */
interface ApiErrorBody {
  error?: string;
  message?: string;
  errors?: unknown;
}

function firstFieldMessage(errors: unknown): string | null {
  if (Array.isArray(errors)) {
    for (const entry of errors) {
      if (typeof entry === "string") return entry;
      const message = (entry as { message?: unknown })?.message;
      if (typeof message === "string") return message;
    }
  }
  return null;
}

/** One sentence, or a hard cap - these land in toasts and inline form errors, not a log. */
function trim(message: string): string {
  return message.includes(". ") ? message.split(". ")[0] + "." : message.substring(0, 150);
}

/**
 * extractFetchError — turns a non-ok Response into the one line worth showing a user.
 *
 * Prefer the BE's own message: every CustomError subclass carries a specific, human-written
 * reason ("Team already registered for this season"), which always beats the generic per-status
 * text. STATUS_MESSAGES is only the floor for responses that never reached errorHandler.
 *
 * Async because reading the body is - call it in the `!res.ok` branch, before throwing.
 */
export async function extractFetchError(response: Response, fallback = "Request failed."): Promise<string> {
  let body: ApiErrorBody | null = null;

  try {
    body = (await response.clone().json()) as ApiErrorBody;
  } catch {
    // Not JSON (an nginx HTML error page, or an empty body) - fall through to the status table.
    body = null;
  }

  const backendMessage = firstFieldMessage(body?.errors) ?? body?.error ?? body?.message;
  if (backendMessage) return trim(backendMessage);

  return STATUS_MESSAGES[response.status] ?? fallback;
}

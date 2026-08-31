import { STATUS_MESSAGES } from "./statusMessages";

/**
 * apiErrorMessage — the synchronous counterpart to extractFetchError, for a value that was
 * *caught* rather than a Response that was inspected: a rejected fetch, a JSON parse failure,
 * or an Error a hook threw itself.
 *
 * A rejected fetch always means the request never reached the server, so it gets the network
 * wording rather than the raw "Failed to fetch", which reads as a bug in the site.
 */
export function apiErrorMessage(err: unknown, fallback = "Request failed."): string {
  if (err && typeof err === "object" && typeof (err as { status?: unknown }).status === "number") {
    const { status } = err as { status: number };
    if (STATUS_MESSAGES[status]) return STATUS_MESSAGES[status];
  }

  if (err instanceof TypeError) return "Network error; check your connection.";
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === "string" && err) return err;

  return fallback;
}

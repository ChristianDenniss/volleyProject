/**
 * classifyServiceError — decides whether a failed request is a site-wide *outage*
 * (worth a full-page branded screen) or an ordinary per-request failure (worth an
 * inline message or a toast, handled by the caller).
 *
 * Ported from troj-model-dashboard, where the input was always an AxiosError. This app
 * talks to the API through `authFetch`/`fetch`, so the two failure shapes are different:
 *
 *   - fetch REJECTS with a TypeError only when the request never completed - DNS failure,
 *     connection refused, TLS failure, CORS block, offline. That is the "can't reach the
 *     server" case.
 *   - fetch RESOLVES for every HTTP status, including 500s, so a `Response` has to be
 *     classified by `.status` rather than by being thrown.
 *
 * Both are accepted here so a caller can hand over whatever it has - a caught error, a
 * Response, or anything with a numeric `status`.
 *
 * 4xx is deliberately never an outage: a 401 on the profile probe just means "not logged
 * in", and a 404 means the record is gone. Neither should black out the site.
 */
export type ServiceErrorKind = "timeout" | "unavailable" | "unexpected";

/** Browsers word an aborted/timed-out fetch differently; these are the variants seen in the wild. */
const TIMEOUT_PATTERN = /timeout|timed out|aborted/i;

/** The message a network-level fetch failure carries in Chrome / Firefox / Safari respectively. */
const NETWORK_PATTERN = /failed to fetch|networkerror|load failed|network request failed/i;

function fromStatus(status: number): ServiceErrorKind | null {
  if (status === 408 || status === 504) return "timeout";
  if (status === 502 || status === 503) return "unavailable";
  if (status >= 500) return "unexpected";
  return null;
}

export function classifyServiceError(err: unknown): ServiceErrorKind | null {
  // A Response the caller checked with `!res.ok` and passed straight through.
  if (typeof Response !== "undefined" && err instanceof Response) {
    return fromStatus(err.status);
  }

  // Anything carrying a numeric status - a Response-like object, or an error the caller
  // annotated with the status it saw.
  if (err && typeof err === "object" && typeof (err as { status?: unknown }).status === "number") {
    return fromStatus((err as { status: number }).status);
  }

  if (err instanceof Error) {
    // AbortController-based cancellation and `AbortSignal.timeout()` both surface as a
    // DOMException whose *name* carries the meaning; the message is often empty.
    if (err.name === "AbortError" || err.name === "TimeoutError") return "timeout";
    if (TIMEOUT_PATTERN.test(err.message)) return "timeout";
    // fetch only rejects with TypeError when the request never reached the server.
    if (err instanceof TypeError || NETWORK_PATTERN.test(err.message)) return "unavailable";
  }

  return null;
}

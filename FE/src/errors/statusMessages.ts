/* Generic per-HTTP-status fallback text - used only when the backend's response body didn't
   carry a more specific message (see extractFetchError). Covers the cases that never reach
   the BE's own errorHandler, e.g. an infra-level proxy 502/504 sitting in front of the app,
   or nginx answering while the API container is still booting. */
export const STATUS_MESSAGES: Record<number, string> = {
  400: "Bad Request.",
  401: "Unauthorized; please log in again.",
  403: "Forbidden; you do not have permission to perform this action.",
  404: "Not Found.",
  408: "Request Timeout; the server took too long to respond.",
  409: "Conflict; that record already exists.",
  413: "Request Entity Too Large.",
  429: "Too Many Requests; please wait before trying again.",
  500: "Internal Server Error.",
  502: "Bad Gateway; the server is unreachable.",
  503: "Service Unavailable; the server is temporarily down.",
  504: "Gateway Timeout; the server did not respond in time.",
};

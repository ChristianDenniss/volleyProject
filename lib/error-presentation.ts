export type ErrorKind =
  | "not-found"
  | "unauthorized"
  | "forbidden"
  | "network"
  | "offline"
  | "timeout"
  | "service-unavailable"
  | "api-response"
  | "render"
  | "conflict"
  | "bad-request"
  | "d1-read-limit"
  | "d1-write-limit"
  | "sql-variables"
  | "import-session-expired"
  | "database"
  | "unknown";

export interface ErrorPresentation {
  kind: ErrorKind;
  title: string;
  body: string;
  hint: string | null;
  /** Short line for toasts, tRPC messages, and previews. */
  summary: string;
  /** Optional primary navigation action (sign in, home, etc.). */
  link?: { href: string; label: string };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function errorChain(error: unknown): string[] {
  const messages: string[] = [];
  const seen = new Set<unknown>();
  let current: unknown = error;

  while (current != null && !seen.has(current) && messages.length < 8) {
    seen.add(current);
    if (current instanceof Error) {
      if (current.message) messages.push(current.message);
      current = current.cause;
      continue;
    }
    if (typeof current === "string" && current.length > 0) {
      messages.push(current);
      break;
    }
    break;
  }

  return messages;
}

export function errorDetail(error: unknown): string {
  return errorChain(error).join(" :: ");
}

function match(blob: string, pattern: RegExp): boolean {
  return pattern.test(blob);
}

function trpcData(error: unknown): { code?: string; cause?: string } | null {
  if (!isRecord(error)) return null;
  const data = isRecord(error.data) ? error.data : null;
  if (!data) return null;
  return {
    code: typeof data.code === "string" ? data.code : undefined,
    cause: typeof data.cause === "string" ? data.cause : undefined,
  };
}

function d1CauseMessage(chain: string[]): string | null {
  const d1Line = chain.find((line) => /d1_error|d1_exec_error|d1_type_error/i.test(line));
  if (!d1Line) return null;
  const cleaned = d1Line.replace(/^.*?(D1_[A-Z_]+:\s*)/i, "").trim();
  return cleaned || d1Line;
}

function lastUsefulMessage(chain: string[]): string {
  const lastUseful = [...chain].reverse().find((line) => !/^Failed query:/i.test(line));
  return lastUseful ?? chain[0] ?? "Something went wrong";
}

function genericNotFoundBody(message?: string): string {
  if (message && !/^not found$/i.test(message.trim())) {
    return message.endsWith(".") ? message : `${message}.`;
  }
  return "Sorry about that. The link may be out of date, or the season, team, player, or article it pointed at may have been removed.";
}

export function presentNotFound(message?: string): ErrorPresentation {
  return {
    kind: "not-found",
    title: "This page could not be found.",
    body: genericNotFoundBody(message),
    hint: null,
    summary: message && !/^not found$/i.test(message.trim()) ? message : "Page not found",
    link: { href: "/", label: "Back to home" },
  };
}

function presentTrpcCode(code: string, message: string): ErrorPresentation | null {
  switch (code) {
    case "NOT_FOUND":
      return presentNotFound(message);
    case "UNAUTHORIZED":
      return {
        kind: "unauthorized",
        title: "You need to sign in.",
        body: "Sorry about that. This page or action needs a Roblox account linked to the league site.",
        hint: null,
        summary: message || "Sign in required",
        link: { href: "/login", label: "Sign in" },
      };
    case "FORBIDDEN":
      return {
        kind: "forbidden",
        title: "You don't have access to this.",
        body: message || "Sorry about that. Your account does not have permission to view or change this.",
        hint: null,
        summary: message || "Access denied",
        link: { href: "/", label: "Back to home" },
      };
    case "CONFLICT":
      return {
        kind: "conflict",
        title: "That change could not be saved.",
        body: message || "Sorry about that. The update conflicted with data that is already on the site.",
        hint: "Refresh the page and check whether it went through before trying again.",
        summary: message || "Conflict. Refresh and try again.",
      };
    case "BAD_REQUEST":
      return {
        kind: "bad-request",
        title: "Something was wrong with that request.",
        body: message || "Sorry about that. The server rejected the input before it could run.",
        hint: "Check required fields and formats, then try again.",
        summary: message || "Invalid request",
      };
    default:
      return null;
  }
}

export function presentError(error: unknown): ErrorPresentation {
  const chain = errorChain(error);
  const detail = chain.join(" :: ");
  const blob = detail.toLowerCase();

  if (match(blob, /free tier daily row read limit/)) {
    return {
      kind: "d1-read-limit",
      title: "We couldn't load league data right now.",
      body: "Sorry about that. The database may have hit its daily read limit on the free tier.",
      hint: "Try refreshing, or come back after midnight UTC. Admins can remove the cap by upgrading to Workers Paid.",
      summary:
        "The database hit today's free-tier read limit. Upgrade D1 to a paid Workers plan, or wait until midnight UTC.",
    };
  }

  if (match(blob, /free tier daily row write limit/)) {
    return {
      kind: "d1-write-limit",
      title: "We couldn't save that right now.",
      body: "Sorry about that. The database may have hit its daily write limit on the free tier.",
      hint: "Try again after midnight UTC, or upgrade to Workers Paid.",
      summary:
        "The database hit today's free-tier write limit. Upgrade D1 to a paid Workers plan, or wait until midnight UTC.",
    };
  }

  if (match(blob, /too many sql variables/)) {
    return {
      kind: "sql-variables",
      title: "That batch was too large.",
      body: "Sorry about that. A database query used more parameters than D1 allows in one statement.",
      hint: "Try a smaller import batch or split the operation and run it again.",
      summary: "A database query used too many parameters for D1. Split the batch and retry.",
    };
  }

  if (match(blob, /import session expired/)) {
    return {
      kind: "import-session-expired",
      title: "Your import preview expired.",
      body: "Sorry about that. Loaded sheet data is kept on the server for about an hour while you review the import.",
      hint: "Go back to the import dialog and run preview again from the start.",
      summary: "Import session expired. Run preview again.",
    };
  }

  if (
    match(blob, /\b404\b/) ||
    match(blob, /page could not be found/) ||
    match(blob, /cannot find .* on this server/) ||
    (match(blob, /not found/) && !match(blob, /column|table|route handler/))
  ) {
    return presentNotFound(lastUsefulMessage(chain));
  }

  if (
    match(blob, /failed to fetch/) ||
    match(blob, /networkerror when attempting to fetch/) ||
    match(blob, /network request failed/) ||
    match(blob, /fetch failed/) ||
    match(blob, /econnrefused/) ||
    match(blob, /enotfound/) ||
    match(blob, /socket hang up/) ||
    match(blob, /connection reset/) ||
    match(blob, /\boffline\b/) ||
    match(blob, /err_internet_disconnected/) ||
    match(blob, /internet connection appears to be offline/)
  ) {
    return {
      kind: match(blob, /\boffline\b|err_internet_disconnected|internet connection appears to be offline/)
        ? "offline"
        : "network",
      title: "We couldn't reach the server.",
      body: "Sorry about that. Please try refreshing and contact us if the problem persists.",
      hint: null,
      summary: "Could not connect to the server. Check your connection and try again.",
    };
  }

  if (
    match(blob, /aborterror/) ||
    match(blob, /\btimed out\b/) ||
    match(blob, /timeout/) ||
    match(blob, /etimedout/) ||
    match(blob, /deadline exceeded/)
  ) {
    return {
      kind: "timeout",
      title: "We couldn't respond to your request in time.",
      body: "Sorry about that. Please try refreshing and contact us if the problem persists.",
      hint: null,
      summary: "The request timed out. Try again.",
    };
  }

  if (
    match(blob, /expected json from the api/) ||
    match(blob, /is not valid json/) ||
    match(blob, /unexpected token '<'/) ||
    match(blob, /<!doctype/) ||
    match(blob, /\b502\b/) ||
    match(blob, /\b503\b/) ||
    match(blob, /\b504\b/) ||
    match(blob, /service unavailable/) ||
    match(blob, /bad gateway/) ||
    match(blob, /gateway timeout/)
  ) {
    return {
      kind: match(blob, /502|503|504|service unavailable|bad gateway|gateway timeout/)
        ? "service-unavailable"
        : "api-response",
      title: "We couldn't reach the server.",
      body: "Sorry about that. Please try refreshing and contact us if the problem persists.",
      hint: null,
      summary: "The service is temporarily unavailable. Try again shortly.",
    };
  }

  if (
    match(blob, /hydration failed/) ||
    match(blob, /error while hydrating/) ||
    match(blob, /server components render/) ||
    match(blob, /minified react error/) ||
    match(blob, /text content does not match/) ||
    match(blob, /failed to render/)
  ) {
    return {
      kind: "render",
      title: "Something went wrong.",
      body: "An unexpected error occurred while loading this page. Reloading usually fixes it.",
      hint: null,
      summary: "The page failed to render. Refresh and try again.",
    };
  }

  const d1Message = d1CauseMessage(chain);
  if (d1Message) {
    return {
      kind: "database",
      title: "We couldn't load league data right now.",
      body: "Sorry about that. The database returned an error.",
      hint: d1Message,
      summary: d1Message,
    };
  }

  const message = lastUsefulMessage(chain);
  return {
    kind: "unknown",
    title: "Something went wrong.",
    body: message === "Something went wrong"
      ? "An unexpected error occurred. Reloading the page usually fixes this."
      : message,
    hint: null,
    summary: message,
  };
}

/** Merge tRPC/client error shape (code, message, data.cause) before classification. */
export function presentUnknownError(error: unknown): ErrorPresentation {
  const trpc = trpcData(error);
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "";

  if (trpc?.code) {
    const fromCode = presentTrpcCode(trpc.code, message);
    if (fromCode) {
      if (trpc.cause && !message.includes(trpc.cause)) {
        const refined = presentError(new Error(message, { cause: new Error(trpc.cause) }));
        if (refined.kind !== "unknown" && refined.kind !== "database") return refined;
      }
      return fromCode;
    }
  }

  if (error instanceof Error) {
    const cause = trpc?.cause ?? null;
    if (cause && !error.message.includes(cause)) {
      return presentError(new Error(error.message, { cause: new Error(cause) }));
    }
  }

  return presentError(error);
}

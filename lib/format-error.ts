import { presentUnknownError } from "@/lib/error-presentation";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function trpcCause(error: unknown): string | null {
  if (!isRecord(error)) return null;
  const data = isRecord(error["data"]) ? error["data"] : null;
  if (!data) return null;
  const cause = data["cause"];
  return typeof cause === "string" && cause.length > 0 ? cause : null;
}

export function formatUnknownError(error: unknown): string {
  const presentation = presentUnknownError(error);
  const cause = trpcCause(error);
  const parts = [presentation.summary, cause].filter((part, index, all): part is string => {
    return Boolean(part) && all.indexOf(part) === index;
  });
  if (parts.length > 0) return parts.join("\n\n");

  try {
    return JSON.stringify(error, null, 2);
  } catch {
    return String(error);
  }
}

export function formatErrorTitle(error: unknown): string {
  return presentUnknownError(error).title;
}

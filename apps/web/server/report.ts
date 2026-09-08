import { errorDetail, presentError } from "@/lib/error-presentation";

export { errorChain, errorDetail } from "@/lib/error-presentation";

export function explainError(error: unknown): { message: string; detail: string } {
  const presentation = presentError(error);
  return {
    message: presentation.summary,
    detail: errorDetail(error),
  };
}

export function logError(scope: string, error: unknown, extra: Record<string, unknown> = {}): void {
  const presentation = presentError(error);
  console.error(
    JSON.stringify({
      level: "error",
      scope,
      kind: presentation.kind,
      message: presentation.summary,
      detail: errorDetail(error),
      ...extra,
    }),
  );
}

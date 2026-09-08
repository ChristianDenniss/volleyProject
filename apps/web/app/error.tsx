"use client";

import { useEffect } from "react";
import { ErrorScreen } from "@components/error-screen";
import { errorDetail, presentUnknownError } from "@/lib/error-presentation";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const presentation = presentUnknownError(error);
  const detail = errorDetail(error);

  useEffect(() => {
    console.error(
      JSON.stringify({
        level: "error",
        scope: "app.error",
        kind: presentation.kind,
        message: presentation.summary,
        detail,
        digest: error.digest ?? null,
      }),
    );
  }, [detail, error, presentation.kind, presentation.summary]);

  return (
    <ErrorScreen
      presentation={presentation}
      detail={detail}
      digest={error.digest ?? null}
      onRetry={() => reset()}
      fullPage
    />
  );
}

"use client";

import { useEffect } from "react";
import { ErrorScreen } from "@components/error-screen";
import { errorDetail, presentUnknownError } from "@/lib/error-presentation";

export default function GlobalError({
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
        scope: "app.global.error",
        kind: presentation.kind,
        message: presentation.summary,
        detail,
        digest: error.digest ?? null,
      }),
    );
  }, [detail, error, presentation.kind, presentation.summary]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-rvl-ground text-rvl-ink antialiased">
        <ErrorScreen
          presentation={presentation}
          detail={detail}
          digest={error.digest ?? null}
          onRetry={() => reset()}
          fullPage
        />
      </body>
    </html>
  );
}

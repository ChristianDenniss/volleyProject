"use client";

import Image from "next/image";
import Link from "next/link";
import { RefreshCw } from "lucide-react";
import type { ErrorPresentation } from "@/lib/error-presentation";
import { Button } from "@components/ui/button";

type ErrorScreenProps = {
  presentation: ErrorPresentation;
  detail?: string | null;
  digest?: string | null;
  onRetry?: () => void;
  /** Full viewport height — use for root-level errors outside site layout. */
  fullPage?: boolean;
};

function reload(onRetry?: () => void) {
  if (onRetry) {
    onRetry();
    return;
  }
  window.location.reload();
}

export function ErrorScreen({
  presentation,
  detail = null,
  digest = null,
  onRetry,
  fullPage = false,
}: ErrorScreenProps) {
  const showTechnical =
    process.env.NODE_ENV === "development" &&
    detail &&
    detail !== presentation.body &&
    detail !== presentation.summary;
  const showRefresh =
    presentation.kind !== "not-found" &&
    presentation.kind !== "forbidden" &&
    presentation.kind !== "unauthorized";

  return (
    <section
      className={
        fullPage
          ? "flex min-h-screen items-center justify-center bg-rvl-ground px-6 py-16"
          : "flex items-center justify-center px-6 py-16"
      }
    >
      <div className="flex w-full max-w-lg flex-col items-center text-center">
        <Image
          src="/rvlLogo.png"
          alt="Volleyball 4-2 League"
          width={224}
          height={224}
          priority
          className="mb-10 h-28 w-auto -rotate-6"
        />
        <h1 className="m-0 text-2xl font-semibold tracking-tight text-rvl-ink">{presentation.title}</h1>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-rvl-ink-2">{presentation.body}</p>
        {presentation.hint ? (
          <p className="mt-3 max-w-md text-sm leading-relaxed text-rvl-ink-2">{presentation.hint}</p>
        ) : null}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {presentation.link ? (
            <Button asChild variant="default" size="lg">
              <Link href={presentation.link.href}>{presentation.link.label}</Link>
            </Button>
          ) : null}
          {showRefresh ? (
            <Button type="button" variant={presentation.link ? "outline" : "default"} size="lg" onClick={() => reload(onRetry)}>
              <RefreshCw />
              Refresh
            </Button>
          ) : null}
        </div>
        {digest ? (
          <p className="mt-6 font-mono text-[0.72rem] text-rvl-dim">Digest {digest}</p>
        ) : null}
        {showTechnical ? (
          <pre className="mt-8 max-h-64 w-full overflow-auto rounded-lg border border-rvl-line bg-rvl-panel/40 p-3 text-left text-xs leading-relaxed text-rvl-ink-2">
            {detail}
          </pre>
        ) : null}
      </div>
    </section>
  );
}

/**
 * ErrorPagesPreview — dev-only gallery of the branded error screens, so they can be looked at
 * without having to actually take the API down.
 *
 * Hub at `/errors`; `/errors/:kind` renders that ServiceErrorPage full-screen, and
 * `/error` throws during render so the top-level ErrorBoundary fallback can be inspected.
 * Registered from App.tsx only when `import.meta.env.DEV` — in a production build the ternary
 * that guards the lazy import folds to null and this file is never bundled.
 *
 * Lives in `components/misc/`.
 */
import React from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import ServiceErrorPage, { SERVICE_ERROR_COPY } from "./ServiceErrorPage";
import type { ServiceErrorKind } from "../../errors/classifyServiceError";

const KINDS: { kind: ServiceErrorKind; blurb: string }[] = [
  { kind: "timeout", blurb: "Gateway timeout — 408/504, or an aborted request." },
  { kind: "unavailable", blurb: "API unreachable — 502/503, connection refused, or offline. Includes the rally game." },
  { kind: "unexpected", blurb: "Unexpected 500-style failure, and the ErrorBoundary fallback." },
];

function isKind(value: string | undefined): value is ServiceErrorKind {
  return value === "timeout" || value === "unavailable" || value === "unexpected";
}

const previewButton =
  "inline-flex items-center justify-center shrink-0 py-2 px-4 " +
  "text-sm font-semibold text-white bg-brand-primary " +
  "border-none rounded-sm cursor-pointer transition-colors duration-200 " +
  "hover:bg-brand-primary-hover";

const ErrorPagesPreview: React.FC = () => {
  const { kind } = useParams();
  const navigate = useNavigate();

  if (isKind(kind)) return <ServiceErrorPage kind={kind} />;
  if (kind) return <Navigate to="/errors" replace />;

  return (
    <div className="mx-auto w-full max-w-2xl px-page py-8">
      <h1 className="m-0 text-page-title font-semibold text-text">Error pages</h1>
      <p className="mt-2 mb-6 text-sm leading-relaxed text-text-muted">
        Dev-only. These are the full-page outage screens (logo, sorry-copy, refresh) — not the inline per-request
        errors a page shows when one fetch fails. The crash row throws so you can watch ErrorBoundary catch it.
      </p>

      <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-bg">
        {KINDS.map(item => (
          <div key={item.kind} className="flex items-center justify-between gap-4 px-5 py-3.5">
            <div className="min-w-0">
              <p className="m-0 text-sm font-semibold text-text">{SERVICE_ERROR_COPY[item.kind].title}</p>
              <p className="mt-0.5 mb-0 text-xs text-text-muted">{item.blurb}</p>
            </div>
            <button type="button" className={previewButton} onClick={() => navigate(`/errors/${item.kind}`)}>
              Preview
            </button>
          </div>
        ))}

        <div className="flex items-center justify-between gap-4 px-5 py-3.5">
          <div className="min-w-0">
            <p className="m-0 text-sm font-semibold text-text">Render crash</p>
            <p className="mt-0.5 mb-0 text-xs text-text-muted">Throws during render so ErrorBoundary takes over.</p>
          </div>
          <button type="button" className={previewButton} onClick={() => navigate("/error")}>
            Preview
          </button>
        </div>

        <div className="flex items-center justify-between gap-4 px-5 py-3.5">
          <div className="min-w-0">
            <p className="m-0 text-sm font-semibold text-text">404 — out of bounds</p>
            <p className="mt-0.5 mb-0 text-xs text-text-muted">The catch-all route, for any unmatched path.</p>
          </div>
          <button type="button" className={previewButton} onClick={() => navigate("/this-page-does-not-exist")}>
            Preview
          </button>
        </div>
      </div>
    </div>
  );
};

export default ErrorPagesPreview;

/**
 * ErrorBoundaryPreview — throws during render so the boundary's fallback can be inspected
 * without manufacturing a real crash. Registered at `/error`.
 */
export function ErrorBoundaryPreview(): never {
  throw new Error("Dev ErrorBoundary preview — this throw is intentional.");
}

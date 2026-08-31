/**
 * ServiceErrorPage — the full-page outage screen: oversized RVL logo, a kind-specific
 * headline (timeout / unavailable / unexpected), sorry-copy, and a refresh action.
 *
 * This is for the cases where the *site* is unusable - the API is unreachable, the gateway
 * timed out, or a render threw - not for an ordinary failed request, which belongs inline on
 * the page that made it (see `extractFetchError`).
 *
 * The `unavailable` kind also renders RallyGame, a keep-the-ball-up mini game, so a visitor
 * waiting out a backend restart has something to do besides mash refresh.
 *
 * Rendered by: ErrorBoundary (unexpected), AuthProvider (when the profile probe can't reach
 * the API at all), and the dev-only `/dev/errors/:kind` preview.
 *
 * Deliberately router-free: AuthProvider sits ABOVE <Router> in App.tsx, so this component
 * must never use <Link> or a router hook. Navigation here is a full page load.
 */
import React from "react";
import { LuRefreshCw } from "react-icons/lu";
import rvlLogo from "../../images/rvlLogo.png";
import { DISCORD_INVITE_URL } from "../../constants/site";
import RallyGame from "../game/RallyGame";
import type { ServiceErrorKind } from "../../errors/classifyServiceError";

export const SERVICE_ERROR_COPY: Record<ServiceErrorKind, { title: string; body: React.ReactNode }> = {
  timeout: {
    title: "We couldn't return your request in time.",
    body: (
      <>
        The server took too long to answer. Try refreshing — if it keeps happening, let us know in the{" "}
        <a
          href={DISCORD_INVITE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand-primary underline underline-offset-2 hover:text-brand-primary-hover"
        >
          Discord
        </a>
        .
      </>
    ),
  },
  unavailable: {
    title: "We couldn't reach the server.",
    body: (
      <>
        Sorry about that — we're probably between rotations. Keep a rally going while you wait, then refresh to try
        again.
      </>
    ),
  },
  unexpected: {
    title: "Something went wrong.",
    body: <>An unexpected error occurred on our side. Reloading the page usually fixes this.</>,
  },
};

interface ServiceErrorPageProps {
  kind: ServiceErrorKind;
  error?: Error | null;
  onReload?: () => void;
  /** True when this replaces the entire page rather than sitting inside the header/nav shell.
   *  Only AuthProvider needs it - everywhere else the screen renders inside `.main-content`,
   *  where a full viewport height would push the fold below the nav. */
  fullScreen?: boolean;
}

/* Tailwind preflight is not loaded in this app (see styles/tailwind.css), so the native
   button chrome has to be cleared explicitly rather than assumed away. Same navy fill and
   hover as .ui-btn-primary, written as utilities so this file needs no stylesheet. */
const refreshButton =
  "inline-flex items-center justify-center gap-2 mt-8 py-2.5 px-5 " +
  "text-sm font-semibold text-white bg-brand-primary " +
  "border-none rounded-sm cursor-pointer transition-colors duration-200 " +
  "hover:bg-brand-primary-hover " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary";

const ServiceErrorPage: React.FC<ServiceErrorPageProps> = ({ kind, error, onReload, fullScreen = false }) => {
  const { title, body } = SERVICE_ERROR_COPY[kind];

  return (
    <div
      className={`flex items-center justify-center bg-bg-light px-6 py-16 ${
        fullScreen ? "min-h-screen" : "min-h-[70vh]"
      }`}
      role="alert"
    >
      <div
        className={`flex w-full flex-col items-center text-center ${
          kind === "unavailable" ? "max-w-xl" : "max-w-lg"
        }`}
      >
        {/* Tilted like a ball mid-flight; decorative, so the headline below carries the meaning. */}
        <img src={rvlLogo} alt="" aria-hidden className="mb-10 h-28 w-auto -rotate-6" />

        <h1 className="m-0 text-2xl font-semibold tracking-tight text-text">{title}</h1>
        <p className="mt-3 mb-0 text-sm leading-relaxed text-text-muted">{body}</p>

        <button type="button" className={refreshButton} onClick={onReload ?? (() => window.location.reload())}>
          <LuRefreshCw size={14} aria-hidden />
          Refresh
        </button>

        {kind === "unavailable" && (
          <div className="mt-10 flex w-full min-w-0 flex-col items-center">
            <RallyGame />
          </div>
        )}

        {/* Dev only: the stack is the whole point of the boundary while working locally, and
            must never ship to visitors. Vite statically replaces import.meta.env.DEV, so this
            branch (and nothing it imports) survives into a production bundle. */}
        {import.meta.env.DEV && error && (
          <pre className="mt-8 max-h-64 w-full overflow-auto rounded-lg border border-border bg-bg p-3 text-left text-xs text-text-muted">
            {error.stack ?? error.message}
          </pre>
        )}
      </div>
    </div>
  );
};

export default ServiceErrorPage;

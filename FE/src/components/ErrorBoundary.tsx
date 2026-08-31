/**
 * ErrorBoundary — top-level class component that catches render/lifecycle throws anywhere in
 * its child tree and shows ServiceErrorPage (`unexpected`) instead of a white screen.
 *
 * Note: React error boundaries only catch errors thrown during rendering, in lifecycle methods,
 * and in constructors of the tree below them — NOT errors in event handlers, async callbacks,
 * or code outside React's render path (those need their own try/catch).
 *
 * Also auto-recovers from stale lazy-chunk load failures. Every route in App.tsx is `lazy()`,
 * so a visitor with the page already open when a new build ships will ask for a hashed chunk
 * filename that no longer exists; that surfaces as a render throw with nothing wrong in the
 * code. One forced reload fetches the new index.html and fixes it.
 *
 * Mounted once around the route tree in App.tsx.
 */
import React from "react";
import ServiceErrorPage from "./misc/ServiceErrorPage";

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/* Session-scoped guard so a chunk-load failure that *isn't* fixed by reloading (the CDN or
   host itself being down) reloads at most once instead of looping forever. */
const CHUNK_RELOAD_FLAG = "chunk-reload-attempted";

/* Browsers word dynamic-import failures differently, but a stale/removed hashed chunk file
   always shows up as some variant of "failed to load/fetch/import the module". */
const CHUNK_LOAD_ERROR_PATTERN =
  /failed to fetch dynamically imported module|error loading dynamically imported module|importing a module script failed|failed to load module script|loading chunk [\w-]+ failed/i;

function isChunkLoadError(error: Error): boolean {
  return CHUNK_LOAD_ERROR_PATTERN.test(error.message ?? "") || CHUNK_LOAD_ERROR_PATTERN.test(error.name ?? "");
}

/* sessionStorage throws in some locked-down browser modes - never let the guard against an
   infinite reload loop itself become an uncaught error. */
function safeSessionStorage(): Storage | null {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

export default class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidMount(): void {
    // A clean initial mount (no error caught on the way down) means the app loaded fine -
    // clear any stale flag from a past incident so a future stale-deploy reload isn't
    // silently skipped.
    if (!this.state.hasError) {
      safeSessionStorage()?.removeItem(CHUNK_RELOAD_FLAG);
    }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    // No error-reporting service is wired into this codebase yet - the console is the
    // current standard for caught errors.
    console.error("Unhandled UI error:", error, info.componentStack);

    if (isChunkLoadError(error)) {
      const storage = safeSessionStorage();
      const alreadyAttempted = storage?.getItem(CHUNK_RELOAD_FLAG) === "1";
      if (!alreadyAttempted) {
        storage?.setItem(CHUNK_RELOAD_FLAG, "1");
        window.location.reload();
        return;
      }
      // Already reloaded once this session and the chunk still fails - fall through to the
      // visible fallback below instead of looping.
    }
  }

  private handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return <ServiceErrorPage kind="unexpected" error={this.state.error} onReload={this.handleReload} />;
    }

    return this.props.children;
  }
}

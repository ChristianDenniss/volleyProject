"use client";

import { SiteLink } from "./site-link";
import { useLiveSession } from "./use-live-session";

const writeClass =
  "bg-rvl-accent-bg px-5 py-3 font-mono text-[0.7rem] font-bold uppercase tracking-[0.14em] text-rvl-on-accent no-underline transition-opacity hover:opacity-85";
const signInClass =
  "border border-rvl-line px-5 py-3 font-mono text-[0.7rem] uppercase tracking-[0.14em] text-rvl-ink-2 no-underline transition-colors hover:border-rvl-accent-soft hover:text-rvl-accent";

export function ArticlesWriteLink() {
  const live = useLiveSession();

  if (live.isPending) {
    return <span className="inline-block h-11 w-36 animate-pulse bg-rvl-line" aria-hidden />;
  }

  if (live.isSignedIn) {
    return (
      <SiteLink href="/articles/create" className={writeClass}>
        Write an article
      </SiteLink>
    );
  }

  return (
    <SiteLink href="/login" className={signInClass}>
      Sign in to write
    </SiteLink>
  );
}

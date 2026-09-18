"use client";

import { SiteLink as Link } from "./site-link";
import { GuestMenu } from "./guest-menu";
import { useLiveSession } from "./use-live-session";

export function SiteAccount() {
  const live = useLiveSession();

  if (live.isPending) {
    return (
      <div className="flex items-center gap-3" aria-busy="true" aria-label="Loading account">
        <span className="hidden h-3 w-24 animate-pulse bg-rvl-line lg:inline-block" />
        <span className="size-8 animate-pulse rounded-xs border border-rvl-line bg-rvl-panel" />
      </div>
    );
  }

  const user = live.user;
  if (!user) return <GuestMenu />;

  return (
    <div className="flex items-center gap-3">
      <span className="hidden font-mono text-[0.72rem] uppercase tracking-[0.12em] text-rvl-dim lg:inline">
        {user.name}
      </span>
      <Link href="/profile" className="block size-8">
        <img
          src={user.image ?? "/images/pfpLogo.png"}
          alt="Profile"
          className="size-8 rounded-xs border border-rvl-line object-cover"
        />
      </Link>
    </div>
  );
}

"use client";

import Link from "next/link";
import { GuestMenu } from "./guest-menu";
import { useLiveSession } from "./use-live-session";

export interface SiteAccountUser {
  name: string;
  image: string | null;
}

export function SiteAccount({ initialUser }: { initialUser: SiteAccountUser | null }) {
  const live = useLiveSession();
  const user = live.isPending ? initialUser : live.user;

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

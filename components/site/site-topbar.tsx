import Link from "next/link";
import { getSessionUser } from "@server/session";
import { isAdmin } from "@server/services/users";
import { GuestMenu } from "./guest-menu";
import { SignOutButton } from "./sign-out-button";
import { SiteTopbarNav } from "./site-topbar-nav";
import { ThemeToggle } from "./theme-toggle";

export async function SiteTopbar() {
  const user = await getSessionUser();

  return (
    <header className="sticky top-0 z-50 flex h-[68px] w-full items-center gap-4 border-b border-rvl-line bg-rvl-ground px-5 sm:gap-7 sm:px-8 xl:px-14">
      <Link
        href="/"
        className="flex shrink-0 items-center gap-2.5 font-mono text-[1.02rem] font-bold uppercase tracking-[-0.02em] text-rvl-ink no-underline"
      >
        <img src="/rvlLogo.png" alt="" className="size-8 shrink-0 object-contain" />
        <span className="hidden whitespace-nowrap xs:inline">Volleyball 4-2</span>
      </Link>

      <SiteTopbarNav isAdmin={user !== null && isAdmin(user.role)} />

      <div className="ml-auto flex shrink-0 items-center gap-3 sm:gap-4">
        <ThemeToggle />
        <a
          href="https://www.roblox.com/games/3840352284/Volleyball-4-2"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden rounded-xs bg-rvl-accent-bg px-4.5 py-2.5 text-[0.8rem] font-bold uppercase tracking-[0.11em] text-rvl-on-accent no-underline transition-opacity hover:opacity-85 sm:inline-block"
        >
          Play Now
        </a>

        {user ? (
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
            <SignOutButton />
          </div>
        ) : (
          <GuestMenu />
        )}
      </div>
    </header>
  );
}

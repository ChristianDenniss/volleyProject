import Link from "next/link";
import { getSessionUser } from "@server/session";
import { getSiteRegion } from "@server/site-region";
import { isAdmin } from "@server/services/users";
import { SiteAccount } from "./site-account";
import { SiteHeaderChrome } from "./site-header-chrome";
import { SiteRegionSelect } from "./site-region-select";
import { SiteTopbarNav } from "./site-topbar-nav";

export async function SiteTopbar() {
  const [user, region] = await Promise.all([getSessionUser(), getSiteRegion()]);

  return (
    <SiteHeaderChrome
      utility={
        <div className="flex h-[var(--site-utility-h)] w-full items-center gap-4 border-b border-rvl-line bg-rvl-panel px-5 sm:px-8 xl:px-14">
          <SiteRegionSelect value={region} />

          <div className="ml-auto flex shrink-0 items-center gap-3 sm:gap-4">
            <a
              href="https://www.roblox.com/games/3840352284/Volleyball-4-2"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden bg-rvl-accent-bg px-4 py-1.5 font-mono text-[0.74rem] font-bold uppercase tracking-[0.11em] text-rvl-on-accent no-underline transition-opacity hover:opacity-85 sm:inline-block"
            >
              Play Now
            </a>

            <SiteAccount
              initialUser={user ? { name: user.name, image: user.image } : null}
            />
          </div>
        </div>
      }
      nav={
        <div className="flex h-14 w-full items-center gap-3 border-b border-rvl-line bg-rvl-ground px-5 sm:gap-5 sm:px-8 xl:px-14">
          <Link
            href="/"
            className="flex shrink-0 items-center gap-2.5 font-mono text-[1.02rem] font-bold uppercase tracking-[-0.02em] text-rvl-ink no-underline"
          >
            <img src="/rvlLogo.png" alt="" className="size-8 shrink-0 object-contain" />
            <span className="sr-only whitespace-nowrap xs:not-sr-only xs:inline">
              Volleyball 4-2
            </span>
          </Link>

          <SiteTopbarNav
            isAdmin={user !== null && isAdmin(user.role)}
            isSignedIn={user !== null}
          />
        </div>
      }
    />
  );
}

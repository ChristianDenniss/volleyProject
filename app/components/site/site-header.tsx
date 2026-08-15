import Link from "next/link";
import { getSessionUser } from "@server/session";
import { GuestMenu } from "./guest-menu";
import { SignOutButton } from "./sign-out-button";

export async function SiteHeader() {
  const user = await getSessionUser();

  return (
    <header className="box-border flex h-[50px] w-full items-center justify-between border-b border-brand-line bg-white px-5 text-brand-ink-soft sm:px-10">
      <div className="flex items-center gap-5 sm:gap-10">
        <Link href="/">
          <img src="/rvlLogo.png" alt="Logo" className="size-[50px] object-contain" />
        </Link>
        <span className="whitespace-nowrap text-base font-semibold text-brand-ink">
          volleyball-4-2.com
        </span>
      </div>

      <div className="flex items-center">
        {user ? (
          <div className="relative flex items-center gap-5">
            <span className="hidden text-lg font-medium text-brand-ink sm:inline">{user.name}</span>
            <Link href="/profile" className="block size-[35px]">
              <img
                src={user.image ?? "/images/pfpLogo.png"}
                alt="Profile Picture"
                className="size-[35px] cursor-pointer rounded-full bg-brand-ink object-cover"
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

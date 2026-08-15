import Link from "next/link";
import { getSessionUser } from "@server/session";
import { isAdmin } from "@server/services/users";
import { Button } from "@components/ui/button";
import { SignOutButton } from "./sign-out-button";

export async function SiteHeader() {
  const user = await getSessionUser();

  return (
    <header className="border-b border-border bg-background">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link href="/" className="flex flex-col leading-tight">
          <span className="text-lg font-semibold tracking-tight text-brand-navy dark:text-foreground">
            Volleyball 4-2
          </span>
          <span className="text-xs uppercase tracking-[0.2em] text-brand-steel">League</span>
        </Link>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              {isAdmin(user.role) ? (
                <Button asChild variant="outline" size="sm">
                  <Link href="/portal">Portal</Link>
                </Button>
              ) : null}
              <Button asChild variant="ghost" size="sm">
                <Link href="/profile">{user.name}</Link>
              </Button>
              <SignOutButton />
            </>
          ) : (
            <Button asChild size="sm">
              <Link href="/login">Sign in</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}

import type { ReactNode } from "react";
import Link from "next/link";
import { requireAdmin } from "@server/session";
import { PortalNav } from "@components/portal/portal-nav";

export const dynamic = "force-dynamic";

export default async function PortalLayout({ children }: { children: ReactNode }) {
  const user = await requireAdmin("/portal");

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border bg-brand-navy text-white">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div>
            <Link href="/portal" className="text-base font-semibold">
              League portal
            </Link>
            <p className="text-xs text-white/70">
              signed in as {user.name} ({user.role})
            </p>
          </div>
          <Link href="/" className="text-sm text-white/80 hover:text-white">
            Back to the site
          </Link>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:flex-row">
        <PortalNav />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}

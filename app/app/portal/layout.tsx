import type { ReactNode } from "react";
import Link from "next/link";
import { requireAdmin } from "@server/session";
import { PortalNav } from "@components/portal/portal-nav";

export const dynamic = "force-dynamic";

export default async function PortalLayout({ children }: { children: ReactNode }) {
  const user = await requireAdmin("/portal");

  return (
    <div className="grid min-h-screen [grid-template-columns:180px_1fr] max-md:grid-cols-1">
      <aside className="box-border flex w-full min-w-[120px] max-w-[220px] flex-col bg-[#1f2937] px-4 py-6 text-[#f9fafb] max-md:max-w-none max-md:flex-row max-md:items-center max-md:justify-between">
        <div>
          <h2 className="mb-5 text-xl font-semibold">
            <Link href="/portal" className="text-white no-underline">
              League portal
            </Link>
          </h2>
          <p className="mb-5 text-xs text-white/70">
            {user.name} ({user.role})
          </p>
        </div>

        <PortalNav />

        <Link
          href="/"
          className="mt-8 text-sm font-medium text-[#cbd5e1] no-underline transition-colors duration-150 hover:text-white max-md:mt-0"
        >
          Back to the site
        </Link>
      </aside>

      <main className="min-w-0 overflow-y-auto bg-[#f8fafc] px-10 py-8 max-md:p-6">{children}</main>
    </div>
  );
}

import type { ReactNode } from "react";
import { SiteFooter } from "@components/site/site-footer";
import { SiteHeader } from "@components/site/site-header";
import { SiteNav } from "@components/site/site-nav";

export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <SiteHeader />
      <SiteNav />
      <main className="flex min-h-full grow flex-col">{children}</main>
      <SiteFooter />
    </div>
  );
}

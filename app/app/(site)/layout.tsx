import type { ReactNode } from "react";
import { SiteFooter } from "@components/site/site-footer";
import { SiteHeader } from "@components/site/site-header";
import { SiteNav } from "@components/site/site-nav";

export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <SiteNav />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}

import type { ReactNode } from "react";
import { SiteFooter } from "@components/site/site-footer";
import { SiteTopbar } from "@components/site/site-topbar";

export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-rvl-ground text-rvl-ink">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:bg-rvl-accent-bg focus:px-4 focus:py-2 focus:font-mono focus:text-[0.76rem] focus:font-bold focus:uppercase focus:tracking-[0.14em] focus:text-rvl-on-accent focus:outline-none"
      >
        Skip to content
      </a>
      <SiteTopbar />
      <main id="main-content" tabIndex={-1} className="flex min-h-full grow flex-col outline-none">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}

import type { ReactNode } from "react";
import { SiteFooter } from "@components/site/site-footer";
import { SiteTopbar } from "@components/site/site-topbar";

export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-rvl-ground text-rvl-ink">
      <SiteTopbar />
      <main className="flex min-h-full grow flex-col">{children}</main>
      <SiteFooter />
    </div>
  );
}

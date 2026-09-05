import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { requireAdmin } from "@server/session";
import { PortalBreadcrumb } from "@components/portal/portal-breadcrumb";
import { PortalClientProviders } from "@components/portal/portal-client-providers";
import { PortalSidebar } from "@components/portal/portal-sidebar";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";

export const dynamic = "force-dynamic";

export default async function PortalLayout({ children }: { children: ReactNode }) {
  const user = await requireAdmin("/portal");
  const sidebarState = (await cookies()).get("sidebar_state")?.value;

  return (
    <PortalClientProviders>
      <TooltipProvider>
        <SidebarProvider defaultOpen={sidebarState !== "false"}>
          <PortalSidebar user={user} />
          <SidebarInset className="bg-rvl-ground text-rvl-ink">
            <header className="flex h-16 shrink-0 items-center gap-2 border-b border-rvl-line bg-rvl-ground transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
              <div className="flex items-center gap-2 px-4">
                <SidebarTrigger className="-ml-1" />
                <Separator
                  orientation="vertical"
                  className="mr-2 data-vertical:h-4 data-vertical:self-auto"
                />
                <PortalBreadcrumb />
              </div>
            </header>
            <div className="flex flex-1 flex-col gap-4 p-6">{children}</div>
          </SidebarInset>
        </SidebarProvider>
      </TooltipProvider>
    </PortalClientProviders>
  );
}

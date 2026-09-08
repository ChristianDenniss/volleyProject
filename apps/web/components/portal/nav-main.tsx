"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronRightIcon,
  LayoutDashboardIcon,
  NewspaperIcon,
  ShieldIcon,
  TrophyIcon,
  UsersIcon,
} from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { PORTAL_NAV, type PortalNavSection } from "@components/portal/nav-data";

const ICONS = {
  dashboard: LayoutDashboardIcon,
  league: ShieldIcon,
  competition: TrophyIcon,
  content: NewspaperIcon,
  admin: UsersIcon,
} as const;

// The sidebar primitive paints hover and active from the same token, so the
// current page needs the accent to stand apart. Same treatment the editor
// toolbar gives an active mark.
const activeLeafClass =
  "data-active:bg-rvl-accent-soft/40 data-active:text-rvl-accent data-active:hover:text-rvl-accent";

const activeSectionClass = "data-active:bg-transparent data-active:text-rvl-ink";

function isItemActive(pathname: string, url: string) {
  return pathname === url || pathname.startsWith(`${url}/`);
}

function sectionIsActive(pathname: string, section: PortalNavSection) {
  if (!section.items) return pathname === section.url;
  return section.items.some((item) => isItemActive(pathname, item.url));
}

function NavSection({ section, pathname }: { section: PortalNavSection; pathname: string }) {
  const Icon = ICONS[section.icon];
  const active = sectionIsActive(pathname, section);
  // The sidebar stays mounted across navigations inside /portal, so an
  // uncontrolled defaultOpen would only ever reflect the page it first mounted
  // on. Track the state so the group can still be toggled by hand, but force it
  // open whenever the current page moves into it.
  const [open, setOpen] = useState(active);

  useEffect(() => {
    if (active) setOpen(true);
  }, [active]);

  if (!section.items) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={active} tooltip={section.title} className={activeLeafClass}>
          <Link href={section.url}>
            <Icon />
            <span>{section.title}</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }

  return (
    <Collapsible asChild open={open} onOpenChange={setOpen} className="group/collapsible">
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton
            tooltip={section.title}
            isActive={active}
            className={activeSectionClass}
          >
            <Icon />
            <span>{section.title}</span>
            <ChevronRightIcon className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {section.items.map((item) => (
              <SidebarMenuSubItem key={item.url}>
                <SidebarMenuSubButton
                  asChild
                  isActive={isItemActive(pathname, item.url)}
                  className={activeLeafClass}
                >
                  <Link href={item.url}>
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  );
}

export function NavMain() {
  const pathname = usePathname();

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Portal</SidebarGroupLabel>
      <SidebarMenu>
        {PORTAL_NAV.map((section) => (
          <NavSection key={section.title} section={section} pathname={pathname} />
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}

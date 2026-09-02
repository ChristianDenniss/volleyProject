"use client";

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

function isItemActive(pathname: string, url: string) {
  return pathname === url || pathname.startsWith(`${url}/`);
}

function sectionIsActive(pathname: string, section: PortalNavSection) {
  if (!section.items) return pathname === section.url;
  return section.items.some((item) => isItemActive(pathname, item.url));
}

export function NavMain() {
  const pathname = usePathname();

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Portal</SidebarGroupLabel>
      <SidebarMenu>
        {PORTAL_NAV.map((section) => {
          const Icon = ICONS[section.icon];
          const active = sectionIsActive(pathname, section);

          if (!section.items) {
            return (
              <SidebarMenuItem key={section.title}>
                <SidebarMenuButton asChild isActive={active} tooltip={section.title}>
                  <Link href={section.url}>
                    <Icon />
                    <span>{section.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          }

          return (
            <Collapsible
              key={section.title}
              asChild
              defaultOpen={active}
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton tooltip={section.title} isActive={active}>
                    <Icon />
                    <span>{section.title}</span>
                    <ChevronRightIcon className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {section.items.map((item) => (
                      <SidebarMenuSubItem key={item.url}>
                        <SidebarMenuSubButton asChild isActive={isItemActive(pathname, item.url)}>
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
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}

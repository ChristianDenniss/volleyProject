export interface PortalNavItem {
  title: string;
  url: string;
}

export interface PortalNavSection {
  title: string;
  url: string;
  icon: "dashboard" | "league" | "competition" | "content" | "admin";
  items?: PortalNavItem[];
}

export const PORTAL_NAV: PortalNavSection[] = [
  { title: "Dashboard", url: "/portal", icon: "dashboard" },
  {
    title: "League",
    url: "/portal/seasons",
    icon: "league",
    items: [
      { title: "Seasons", url: "/portal/seasons" },
      { title: "Teams", url: "/portal/teams" },
      { title: "Players", url: "/portal/players" },
    ],
  },
  {
    title: "Competition",
    url: "/portal/games",
    icon: "competition",
    items: [
      { title: "Games", url: "/portal/games" },
      { title: "Stats", url: "/portal/stats" },
      { title: "Records", url: "/portal/records" },
      { title: "Awards", url: "/portal/awards" },
    ],
  },
  {
    title: "Content",
    url: "/portal/articles",
    icon: "content",
    items: [{ title: "Articles", url: "/portal/articles" }],
  },
  {
    title: "Admin",
    url: "/portal/users",
    icon: "admin",
    items: [{ title: "Users", url: "/portal/users" }],
  },
];

export function findPortalPage(pathname: string): { section: string; page: string } {
  for (const section of PORTAL_NAV) {
    for (const item of section.items ?? []) {
      if (pathname === item.url || pathname.startsWith(`${item.url}/`)) {
        return { section: section.title, page: item.title };
      }
    }
  }
  return { section: "Portal", page: "Dashboard" };
}

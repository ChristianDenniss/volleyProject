"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/portal", label: "Dashboard" },
  { href: "/portal/seasons", label: "Seasons" },
  { href: "/portal/teams", label: "Teams" },
  { href: "/portal/players", label: "Players" },
  { href: "/portal/games", label: "Games" },
  { href: "/portal/stats", label: "Stats" },
  { href: "/portal/matches", label: "Matches" },
  { href: "/portal/awards", label: "Awards" },
  { href: "/portal/articles", label: "Articles" },
  { href: "/portal/users", label: "Users" },
];

export function PortalNav() {
  const pathname = usePathname();

  return (
    <nav className="lg:w-52 lg:shrink-0">
      <ul className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
        {LINKS.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className={cn(
                "block whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground",
                (link.href === "/portal" ? pathname === "/portal" : pathname.startsWith(link.href)) &&
                  "bg-muted text-foreground",
              )}
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

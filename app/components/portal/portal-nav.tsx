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
    <nav>
      <ul className="m-0 list-none p-0 max-md:flex max-md:flex-wrap max-md:gap-4">
        {LINKS.map((link, index) => (
          <li key={link.href} className={cn(index > 0 && "mt-5 max-md:mt-0")}>
            <Link
              href={link.href}
              className={cn(
                "font-medium text-[#cbd5e1] no-underline transition-colors duration-150 hover:text-white",
                (link.href === "/portal" ? pathname === "/portal" : pathname.startsWith(link.href)) &&
                  "text-[#38bdf8]",
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

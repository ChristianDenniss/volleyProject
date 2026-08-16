"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, ExternalLink, Menu } from "lucide-react";
import { Button } from "@components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const PRIMARY = [
  { href: "/schedules", label: "Schedules" },
  { href: "/stats", label: "Stats" },
  { href: "/games", label: "Games" },
  { href: "/teams", label: "Teams" },
  { href: "/players", label: "Players" },
  { href: "/seasons", label: "Seasons" },
];

const SECONDARY = [
  { href: "/records", label: "Records" },
  { href: "/awards", label: "Awards" },
  { href: "/articles", label: "Articles" },
  { href: "/faq", label: "FAQ" },
  { href: "/trivia", label: "Trivia" },
];

const EXTERNAL = [
  { href: "https://discord.gg/volleyball", label: "Roblox Volleyball League" },
  { href: "https://www.roblox.com/games/3840352284/Volleyball-4-2", label: "Play Now" },
];

const linkClass =
  "rounded-md px-3 py-2 text-sm font-medium text-white/80 no-underline transition-colors hover:bg-white/10 hover:text-white lg:text-base";

export function SiteNavBar({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  const allLinks = [...PRIMARY, ...SECONDARY, ...(isAdmin ? [{ href: "/portal", label: "Admin" }] : [])];

  return (
    <nav className="w-full bg-brand-ink">
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center gap-2 px-4 sm:px-6">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="lg"
              aria-label="Open navigation"
              className="text-white hover:bg-white/10 hover:text-white md:hidden"
            >
              <Menu />
              Menu
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" sideOffset={8} className="min-w-56">
            {allLinks.map((link) => (
              <DropdownMenuItem key={link.href} asChild>
                <Link href={link.href}>{link.label}</Link>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Community</DropdownMenuLabel>
            {EXTERNAL.map((link) => (
              <DropdownMenuItem key={link.href} asChild>
                <a href={link.href} target="_blank" rel="noopener noreferrer">
                  {link.label}
                  <ExternalLink className="ml-auto size-3.5 opacity-60" />
                </a>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <ul className="hidden min-w-0 list-none items-center gap-1 p-0 md:flex">
          {PRIMARY.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className={cn(linkClass, isActive(link.href) && "bg-white/15 text-white")}
              >
                {link.label}
              </Link>
            </li>
          ))}

          {SECONDARY.map((link) => (
            <li key={link.href} className="hidden xl:block">
              <Link
                href={link.href}
                className={cn(linkClass, isActive(link.href) && "bg-white/15 text-white")}
              >
                {link.label}
              </Link>
            </li>
          ))}

          <li>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="lg"
                  className="text-white/80 hover:bg-white/10 hover:text-white aria-expanded:bg-white/10 aria-expanded:text-white lg:text-base"
                >
                  More
                  <ChevronDown className="opacity-70" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" sideOffset={8} className="min-w-56">
                <div className="xl:hidden">
                  {SECONDARY.map((link) => (
                    <DropdownMenuItem key={link.href} asChild>
                      <Link href={link.href}>{link.label}</Link>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                </div>
                <DropdownMenuLabel>Community</DropdownMenuLabel>
                {EXTERNAL.map((link) => (
                  <DropdownMenuItem key={link.href} asChild>
                    <a href={link.href} target="_blank" rel="noopener noreferrer">
                      {link.label}
                      <ExternalLink className="ml-auto size-3.5 opacity-60" />
                    </a>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </li>

          {isAdmin ? (
            <li>
              <Link
                href="/portal"
                className={cn(linkClass, isActive("/portal") && "bg-white/15 text-white")}
              >
                Admin
              </Link>
            </li>
          ) : null}
        </ul>
      </div>
    </nav>
  );
}

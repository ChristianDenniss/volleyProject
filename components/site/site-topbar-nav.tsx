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
  { href: "/", label: "Home" },
  { href: "/schedules", label: "Schedules" },
  { href: "/stats", label: "Stats" },
  { href: "/teams", label: "Teams" },
  { href: "/players", label: "Players" },
];

const SECONDARY = [
  { href: "/games", label: "Games" },
  { href: "/seasons", label: "Seasons" },
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
  "rounded-xs px-3.5 py-2.5 text-[0.8rem] font-semibold uppercase tracking-[0.11em] text-rvl-dim no-underline transition-colors hover:text-rvl-ink";

export function SiteTopbarNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

  const adminLink = isAdmin ? [{ href: "/portal", label: "Admin" }] : [];
  const allLinks = [...PRIMARY, ...SECONDARY, ...adminLink];

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            aria-label="Open navigation"
            className="text-rvl-ink-2 hover:bg-rvl-panel hover:text-rvl-ink md:hidden"
          >
            <Menu />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" sideOffset={12} className="min-w-56">
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

      <ul className="hidden min-w-0 list-none items-center gap-1.5 p-0 md:flex">
        {PRIMARY.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className={cn(
                linkClass,
                isActive(link.href) &&
                  "bg-rvl-accent-bg text-rvl-on-accent hover:text-rvl-on-accent",
              )}
            >
              {link.label}
            </Link>
          </li>
        ))}

        <li>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={cn(
                  linkClass,
                  "inline-flex cursor-pointer items-center gap-1 border-none bg-transparent aria-expanded:text-rvl-ink",
                )}
              >
                More
                <ChevronDown className="size-3.5 opacity-70" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" sideOffset={12} className="min-w-56">
              {SECONDARY.map((link) => (
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
        </li>

        {isAdmin ? (
          <li>
            <Link
              href="/portal"
              className={cn(linkClass, isActive("/portal") && "bg-rvl-accent-bg text-rvl-on-accent")}
            >
              Admin
            </Link>
          </li>
        ) : null}
      </ul>
    </>
  );
}

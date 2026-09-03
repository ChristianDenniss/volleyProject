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

const LEAGUE = [
  { href: "/games", label: "Games" },
  { href: "/seasons", label: "Seasons" },
  { href: "/records", label: "Records" },
  { href: "/vector-graph", label: "Stats vector" },
  { href: "/awards", label: "Awards" },
  { href: "/articles", label: "Articles" },
  { href: "/trivia", label: "Trivia" },
  { href: "/faq", label: "FAQ" },
  { href: "/applications", label: "Applications" },
];

const SITE = [
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/credits", label: "Credits" },
  { href: "/privacy-policy", label: "Privacy Policy" },
  { href: "/terms-of-service", label: "Terms of Service" },
];

const EXTERNAL = [
  { href: "https://discord.gg/volleyball", label: "Discord" },
  { href: "https://www.roblox.com/games/3840352284/Volleyball-4-2", label: "Play on Roblox" },
  { href: "https://www.youtube.com/@RobloxVolleyballLeague", label: "YouTube" },
];

const linkClass =
  "rounded-xs px-3.5 py-2.5 text-[0.8rem] font-semibold uppercase tracking-[0.11em] text-rvl-dim no-underline transition-colors hover:text-rvl-ink";

function accountLinks(isSignedIn: boolean) {
  return isSignedIn
    ? [
        { href: "/profile", label: "Profile" },
        { href: "/articles/create", label: "Write an article" },
      ]
    : [{ href: "/login", label: "Login" }];
}

export function SiteTopbarNav({
  isAdmin,
  isSignedIn,
}: {
  isAdmin: boolean;
  isSignedIn: boolean;
}) {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

  const account = accountLinks(isSignedIn);
  const moreHrefs = [...LEAGUE, ...SITE, ...account, ...(isAdmin ? [{ href: "/portal" }] : [])];
  const moreActive = moreHrefs.some((link) => isActive(link.href));

  const morePanel = (
    <div className="grid grid-cols-2 gap-x-6 p-1">
      <div>
        <DropdownMenuLabel>League</DropdownMenuLabel>
        {LEAGUE.map((link) => (
          <DropdownMenuItem key={link.href} asChild>
            <Link href={link.href}>{link.label}</Link>
          </DropdownMenuItem>
        ))}
      </div>
      <div>
        <DropdownMenuLabel>The site</DropdownMenuLabel>
        {SITE.map((link) => (
          <DropdownMenuItem key={link.href} asChild>
            <Link href={link.href}>{link.label}</Link>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Account</DropdownMenuLabel>
        {account.map((link) => (
          <DropdownMenuItem key={link.href} asChild>
            <Link href={link.href}>{link.label}</Link>
          </DropdownMenuItem>
        ))}
        {isAdmin ? (
          <DropdownMenuItem asChild>
            <Link href="/portal">Admin</Link>
          </DropdownMenuItem>
        ) : null}
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
      </div>
    </div>
  );

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
        <DropdownMenuContent align="start" sideOffset={12} className="min-w-72 p-0">
          {PRIMARY.map((link) => (
            <DropdownMenuItem key={link.href} asChild>
              <Link href={link.href}>{link.label}</Link>
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          {morePanel}
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
                  moreActive && "bg-rvl-accent-bg text-rvl-on-accent hover:text-rvl-on-accent",
                )}
              >
                More
                <ChevronDown className="size-3.5 opacity-70" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" sideOffset={12} className="min-w-[28rem] p-0">
              {morePanel}
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

"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/seasons", label: "Seasons" },
  { href: "/teams", label: "Teams" },
  { href: "/players", label: "Players" },
  { href: "/games", label: "Games" },
  { href: "/schedules", label: "Schedules" },
  { href: "/stats", label: "Stats" },
  { href: "/records", label: "Records" },
  { href: "/awards", label: "Awards" },
  { href: "/articles", label: "Articles" },
  { href: "/trivia", label: "Trivia" },
];

export function SiteNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <nav className="border-b border-border bg-brand-navy text-white">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <ul className="hidden gap-1 py-1 md:flex">
          {LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className={cn(
                  "block rounded-md px-3 py-2 text-sm font-medium text-white/80 transition-colors hover:bg-brand-navy-hover hover:text-white",
                  isActive(link.href) && "bg-brand-navy-hover text-white",
                )}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-label="Toggle navigation"
          className="my-2 inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium md:hidden"
        >
          {open ? <X className="size-4" /> : <Menu className="size-4" />}
          Menu
        </button>
      </div>

      {open ? (
        <ul className="border-t border-white/10 px-4 pb-3 md:hidden">
          {LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "block rounded-md px-3 py-2 text-sm font-medium text-white/80",
                  isActive(link.href) && "bg-brand-navy-hover text-white",
                )}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </nav>
  );
}

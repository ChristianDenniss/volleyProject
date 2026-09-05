"use client";

import Link from "next/link";
import { Menu, UserRoundX } from "lucide-react";
import { Button } from "@components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@components/ui/dropdown-menu";

export function GuestMenu() {
  return (
    <div className="flex items-center gap-3 sm:gap-4">
      <span
        className="flex size-9 items-center justify-center rounded-xs border border-rvl-line text-rvl-dim"
        aria-label="Signed out"
      >
        <UserRoundX className="size-4" />
      </span>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon-lg" aria-label="Open account menu">
            <Menu />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" sideOffset={8} className="min-w-40">
          <DropdownMenuLabel>Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/login">Login</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/login">Sign Up</Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

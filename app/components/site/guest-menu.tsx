"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

export function GuestMenu() {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative">
      <div className="flex items-center gap-5 sm:gap-10">
        <span className="whitespace-nowrap text-lg font-black text-brand-ink">Guest</span>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-label="Open account menu"
          className="cursor-pointer rounded-md border-none bg-brand-ink px-3 py-2 text-base text-white transition-colors duration-300 hover:bg-brand-line hover:text-brand-ink"
        >
          ☰
        </button>
      </div>
      {open ? (
        <div
          ref={dropdownRef}
          className="absolute right-0 top-[110%] z-[999] flex h-20 min-w-[140px] flex-col items-center justify-center rounded-md border border-white bg-brand-ink p-2.5 shadow-[0_4px_10px_rgba(0,0,0,0.1)]"
        >
          <Link href="/login" className="mb-2 py-1 text-sm text-white hover:underline">
            Login
          </Link>
          <Link href="/login" className="py-1 text-sm text-white hover:underline">
            Sign Up
          </Link>
        </div>
      ) : null}
    </div>
  );
}

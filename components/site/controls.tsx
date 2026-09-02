"use client";

import type { ChangeEvent, ReactNode } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

const ARROW =
  "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%237a8391'%3e%3cpath d='M7 10l5 5 5-5z'/%3e%3c/svg%3e\")";

export function FilterSelect({
  id,
  label,
  value,
  onChange,
  children,
  className,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label
        htmlFor={id}
        className="font-mono text-[0.58rem] uppercase tracking-[0.22em] text-rvl-dim"
      >
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(event: ChangeEvent<HTMLSelectElement>) => onChange(event.target.value)}
        style={{
          backgroundImage: ARROW,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right 8px center",
          backgroundSize: "18px",
        }}
        className="min-w-[150px] cursor-pointer appearance-none rounded-xs border border-rvl-line bg-transparent py-2.5 pl-3.5 pr-9 font-mono text-[0.78rem] uppercase tracking-[0.08em] text-rvl-ink transition-colors hover:border-rvl-line-strong focus:border-rvl-accent-soft focus:outline-none"
      >
        {children}
      </select>
    </div>
  );
}

export function ClearFiltersButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="cursor-pointer self-end whitespace-nowrap rounded-xs border border-rvl-line bg-transparent px-4 py-2.5 font-mono text-[0.68rem] uppercase tracking-[0.14em] text-rvl-dim transition-colors hover:border-rvl-accent-soft hover:text-rvl-accent"
    >
      Clear filters
    </button>
  );
}

export function SearchBar({
  value,
  onSearch,
  placeholder = "Search...",
  className,
}: {
  value: string;
  onSearch: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={cn("relative flex grow items-center", className)}>
      <Search className="pointer-events-none absolute left-3 size-4 text-rvl-dim" />
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onSearch(event.target.value)}
        className="w-full rounded-xs border border-rvl-line bg-transparent py-2.5 pl-10 pr-3 text-[0.9rem] text-rvl-ink placeholder:text-rvl-dim focus:border-rvl-accent-soft focus:outline-none"
      />
    </div>
  );
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  variant = "default",
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  variant?: "default" | "compact";
}) {
  const pages = Math.max(totalPages, 1);
  const buttonClass =
    "cursor-pointer rounded-xs border border-rvl-line bg-transparent px-3 py-2 font-mono text-[0.66rem] uppercase tracking-[0.14em] text-rvl-ink-2 transition-colors hover:enabled:border-rvl-accent-soft hover:enabled:text-rvl-accent disabled:cursor-not-allowed disabled:border-rvl-line disabled:text-rvl-dim disabled:opacity-50";

  return (
    <div className={cn("flex items-center gap-2", variant === "default" && "my-5 justify-center")}>
      <button
        type="button"
        className={buttonClass}
        onClick={() => onPageChange(1)}
        disabled={currentPage === 1}
      >
        First
      </button>
      <button
        type="button"
        className={buttonClass}
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        Prev
      </button>
      <span className="px-1 font-mono text-[0.72rem] tabular-nums text-rvl-dim">
        {currentPage} / {pages}
      </span>
      <button
        type="button"
        className={buttonClass}
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === pages}
      >
        Next
      </button>
      <button
        type="button"
        className={buttonClass}
        onClick={() => onPageChange(pages)}
        disabled={currentPage === pages}
      >
        Last
      </button>
    </div>
  );
}

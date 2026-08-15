"use client";

import type { ChangeEvent, ReactNode } from "react";
import { cn } from "@/lib/utils";

const ARROW =
  "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3e%3cpath d='M7 10l5 5 5-5z'/%3e%3c/svg%3e\")";

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
    <div className={cn("m-0 whitespace-nowrap", className)}>
      <label htmlFor={id} className="mr-2 font-medium text-[#2d3748]">
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
          backgroundSize: "20px",
        }}
        className="cursor-pointer appearance-none rounded border border-brand-navy bg-brand-navy py-2 pl-4 pr-8 text-[15px] text-white shadow-none transition-colors duration-200 hover:border-brand-steel hover:bg-brand-steel focus:border-brand-steel focus:bg-brand-steel focus:shadow-[0_0_0_2px_rgba(45,60,80,0.2)] focus:outline-none"
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
      className="cursor-pointer whitespace-nowrap rounded-md border border-[#ff6b6b] bg-[#ff6b6b] px-4 py-2 text-sm text-white transition-all duration-300 hover:border-[#ff5252] hover:bg-[#ff5252]"
    >
      Clear Filters
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
    <div className={cn("flex grow justify-center", className)}>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onSearch(event.target.value)}
        className="w-full max-w-[400px] rounded-[5px] border border-[#ccc] p-2.5 text-base max-md:max-w-none"
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
    variant === "compact"
      ? "h-[30px] cursor-pointer rounded-md border border-brand-navy bg-brand-navy px-2 text-sm text-white transition-colors duration-200 hover:enabled:border-brand-steel hover:enabled:bg-brand-steel disabled:cursor-not-allowed disabled:border-[#e5e7eb] disabled:bg-[#e5e7eb] disabled:text-[#9ca3af]"
      : "cursor-pointer rounded-[5px] border-none bg-brand-sky-pale px-5 py-2.5 text-sm text-white transition duration-300 hover:enabled:scale-105 hover:enabled:bg-[#4b5563] disabled:cursor-not-allowed disabled:bg-[#dde3e9]";

  return (
    <div
      className={cn(
        "flex items-center justify-center gap-2.5",
        variant === "default" && "my-5",
      )}
    >
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
      <span className="text-base font-bold text-[#1f2937]">
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

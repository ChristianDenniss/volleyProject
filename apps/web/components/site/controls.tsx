"use client";

import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select";

export const ALL_VALUE = "__all";

export interface FilterOption {
  value: string;
  label: string;
}

export const selectTriggerClass =
  "min-w-[150px] rounded-xs border-rvl-line bg-transparent px-3.5 font-mono text-[0.78rem] uppercase tracking-[0.08em] text-rvl-ink transition-colors data-[size=default]:h-10 hover:border-rvl-line-strong focus-visible:border-rvl-accent-soft focus-visible:ring-0";

export const selectContentClass = "rounded-xs border-rvl-line";

export const selectItemClass =
  "rounded-xs font-mono text-[0.76rem] uppercase tracking-[0.08em] focus:bg-rvl-panel focus:text-rvl-accent";

export function FilterSelect({
  id,
  label,
  value,
  onChange,
  options,
  placeholder,
  className,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: FilterOption[];
  placeholder?: string;
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
      <Select
        value={value === "" ? ALL_VALUE : value}
        onValueChange={(next) => onChange(next === ALL_VALUE ? "" : next)}
      >
        <SelectTrigger id={id} className={selectTriggerClass}>
          <SelectValue placeholder={placeholder ?? "Choose"} />
        </SelectTrigger>
        <SelectContent className={selectContentClass}>
          {options.map((option) => (
            <SelectItem
              key={option.value || ALL_VALUE}
              value={option.value === "" ? ALL_VALUE : option.value}
              className={selectItemClass}
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
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
    "cursor-pointer rounded-xs border border-rvl-line bg-transparent px-2.5 py-2 font-mono text-[0.78rem] leading-none text-rvl-ink-2 transition-colors hover:enabled:border-rvl-accent-soft hover:enabled:text-rvl-accent disabled:cursor-not-allowed disabled:border-rvl-line disabled:text-rvl-dim disabled:opacity-50";

  return (
    <div className={cn("flex items-center gap-2", variant === "default" && "my-5 justify-center")}>
      <button
        type="button"
        className={buttonClass}
        onClick={() => onPageChange(1)}
        disabled={currentPage === 1}
        aria-label="First page"
      >
        {"<<"}
      </button>
      <button
        type="button"
        className={buttonClass}
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="Previous page"
      >
        {"<"}
      </button>
      <span className="px-1 font-mono text-[0.72rem] tabular-nums text-rvl-dim">
        {currentPage} / {pages}
      </span>
      <button
        type="button"
        className={buttonClass}
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === pages}
        aria-label="Next page"
      >
        {">"}
      </button>
      <button
        type="button"
        className={buttonClass}
        onClick={() => onPageChange(pages)}
        disabled={currentPage === pages}
        aria-label="Last page"
      >
        {">>"}
      </button>
    </div>
  );
}

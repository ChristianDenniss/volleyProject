"use client";

import { cn } from "@/lib/utils";

export const SEASON_END_TBH = "TBH";

export function seasonEndDateFromForm(value: string): string | null {
  const trimmed = value.trim();
  if (trimmed === "" || trimmed === SEASON_END_TBH) return null;
  return trimmed;
}

export function seasonEndDateToForm(value: string | null | undefined): string {
  return value ? value : SEASON_END_TBH;
}

export function DateOrTbhField({
  id,
  value,
  onChange,
  disabled,
  required,
  className,
  tbhLabel = SEASON_END_TBH,
}: {
  id?: string;
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  tbhLabel?: string;
}) {
  const tbh = value === tbhLabel;

  return (
    <div className="flex items-stretch gap-2">
      <input
        id={id}
        type="date"
        required={required && !tbh}
        disabled={disabled}
        value={tbh ? "" : value}
        onChange={(event) => onChange(event.target.value)}
        className={cn("min-w-0 flex-1", className)}
      />
      <button
        type="button"
        disabled={disabled}
        aria-pressed={tbh}
        onClick={() => onChange(tbhLabel)}
        className={cn(
          "flex shrink-0 items-center self-stretch cursor-pointer border px-3 font-mono text-[0.68rem] uppercase tracking-[0.14em]",
          tbh
            ? "border-rvl-accent-soft text-rvl-accent"
            : "border-rvl-line text-rvl-dim hover:border-rvl-line-strong hover:text-rvl-ink",
          disabled && "cursor-not-allowed opacity-50",
        )}
      >
        {tbhLabel}
      </button>
    </div>
  );
}

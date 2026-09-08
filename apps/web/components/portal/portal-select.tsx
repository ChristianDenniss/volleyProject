"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select";

const triggerClass =
  "w-full rounded-xs border-rvl-line bg-transparent px-3.5 text-[0.9rem] data-[size=default]:h-10 hover:border-rvl-line-strong focus-visible:border-rvl-accent-soft focus-visible:ring-0";

const itemClass = "rounded-xs text-[0.88rem] focus:bg-rvl-panel focus:text-rvl-accent";

export function PortalSelect({
  id,
  value,
  onChange,
  options,
  required,
  placeholder = "Choose…",
}: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <Select value={value} onValueChange={onChange} required={required ?? false}>
      <SelectTrigger id={id} className={triggerClass}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="rounded-xs border-rvl-line">
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value} className={itemClass}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

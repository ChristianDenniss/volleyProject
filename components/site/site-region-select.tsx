"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

const REGIONS = [
  { code: "na", label: "NA" },
  { code: "eu", label: "EU" },
  { code: "as", label: "AS" },
  { code: "sa", label: "SA" },
] as const;

export function SiteRegionSelect() {
  const [selected, setSelected] = useState<(typeof REGIONS)[number]["code"]>("na");

  return (
    <div className="flex gap-1.5" role="group" aria-label="Region">
      {REGIONS.map((region) => {
        const active = region.code === selected;
        return (
          <button
            key={region.code}
            type="button"
            aria-pressed={active}
            onClick={() => setSelected(region.code)}
            className={cn(
              "cursor-pointer border px-3 py-1.5 font-mono text-[0.68rem] uppercase tracking-[0.15em]",
              active
                ? "border-rvl-accent-soft text-rvl-accent"
                : "border-rvl-line text-rvl-dim hover:border-rvl-line-strong hover:text-rvl-ink",
            )}
          >
            {region.label}
          </button>
        );
      })}
    </div>
  );
}

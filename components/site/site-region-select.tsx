"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  SITE_REGIONS,
  siteRegionCookie,
  type SiteRegion,
} from "@/lib/region";
import { cn } from "@/lib/utils";
import { beginSiteNav, endSiteNav } from "./site-nav-progress";

const LABELS: Record<SiteRegion, string> = {
  all: "ALL",
  na: "NA",
  eu: "EU",
  as: "AS",
  sa: "SA",
};

export function SiteRegionSelect({ value }: { value: SiteRegion }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [selected, setSelected] = useState(value);
  const startedNav = useRef(false);

  useEffect(() => {
    if (pending || !startedNav.current) return;
    startedNav.current = false;
    endSiteNav();
  }, [pending]);

  return (
    <div className="flex gap-1.5" role="group" aria-label="Region" aria-busy={pending}>
      {SITE_REGIONS.map((region) => {
        const active = region === selected;
        return (
          <button
            key={region}
            type="button"
            aria-pressed={active}
            disabled={pending && !active}
            onClick={() => {
              if (region === selected) return;
              setSelected(region);
              document.cookie = siteRegionCookie(region);
              startedNav.current = true;
              beginSiteNav();
              startTransition(() => {
                router.refresh();
              });
            }}
            className={cn(
              "cursor-pointer border px-3 py-1.5 font-mono text-[0.68rem] uppercase tracking-[0.15em]",
              active
                ? "border-rvl-accent-soft text-rvl-accent"
                : "border-rvl-line text-rvl-dim hover:border-rvl-line-strong hover:text-rvl-ink",
              pending && !active && "opacity-60",
            )}
          >
            {LABELS[region]}
          </button>
        );
      })}
    </div>
  );
}

"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  hrefWithParams,
  parseSiteRegion,
  siteRegionCookie,
  SITE_REGIONS,
  SITE_REGION_PARAM,
  withRegionParam,
  type SiteRegion,
} from "@/lib/region";
import { cn } from "@/lib/utils";

const LABELS: Record<SiteRegion, string> = {
  all: "ALL",
  na: "NA",
  eu: "EU",
  as: "AS",
  sa: "SA",
};

export function SiteRegionSelect({ value }: { value: SiteRegion }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [selected, setSelected] = useState<SiteRegion>(value);

  const fromUrl = searchParams.get(SITE_REGION_PARAM);

  useEffect(() => {
    setSelected(fromUrl === null ? value : parseSiteRegion(fromUrl));
  }, [fromUrl, value]);

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
              document.cookie = siteRegionCookie(region);
              const next = withRegionParam(searchParams, region);
              next.delete("page");
              startTransition(() => {
                router.push(hrefWithParams(pathname, next));
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

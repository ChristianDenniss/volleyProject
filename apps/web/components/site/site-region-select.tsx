"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  hrefWithParams,
  parseSiteRegion,
  siteRegionCookie,
  SITE_REGIONS,
  SITE_REGION_COOKIE,
  SITE_REGION_PARAM,
  withRegionParam,
  type SiteRegion,
} from "@/lib/region";
import { cn } from "@/lib/utils";
import { beginSiteNav } from "./site-nav-progress";

const LABELS: Record<SiteRegion, string> = {
  all: "ALL",
  na: "NA",
  eu: "EU",
  as: "AS",
  sa: "SA",
};

function regionFromDocumentCookie(): SiteRegion {
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${SITE_REGION_COOKIE}=([^;]+)`));
  return parseSiteRegion(match?.[1] ? decodeURIComponent(match[1]) : undefined);
}

export function SiteRegionSelect({ value }: { value?: SiteRegion }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [ready, setReady] = useState(value !== undefined);
  const [selected, setSelected] = useState<SiteRegion>(value ?? "na");

  const fromUrl = searchParams.get(SITE_REGION_PARAM);

  useEffect(() => {
    if (value !== undefined) {
      setSelected(fromUrl === null ? value : parseSiteRegion(fromUrl));
      setReady(true);
      return;
    }
    setSelected(fromUrl === null ? regionFromDocumentCookie() : parseSiteRegion(fromUrl));
    setReady(true);
  }, [fromUrl, value]);

  if (!ready) {
    return (
      <div className="flex gap-1.5" role="group" aria-label="Region" aria-busy="true">
        {SITE_REGIONS.map((region) => (
          <span
            key={region}
            className="h-[1.9rem] w-10 animate-pulse border border-rvl-line bg-rvl-panel"
          />
        ))}
      </div>
    );
  }

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
              beginSiteNav();
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

import {
  parseSiteRegion,
  regionQuery,
  SITE_REGION_PARAM,
  type SiteRegion,
} from "@/lib/region";

export type RegionSearchParams = Record<string, string | string[] | undefined>;

function paramRegion(params: RegionSearchParams | undefined): string | undefined {
  const raw = params?.[SITE_REGION_PARAM];
  return Array.isArray(raw) ? raw[0] : raw;
}

/** URL `r` only — never cookies(), so public RSC can stay in the ISR cache. */
export function getSiteRegion(params?: RegionSearchParams): SiteRegion {
  const fromParam = paramRegion(params);
  if (fromParam !== undefined) return parseSiteRegion(fromParam);
  return parseSiteRegion(undefined);
}

export function getSiteRegionQuery(params?: RegionSearchParams) {
  const selected = getSiteRegion(params);
  return { selected, query: regionQuery(selected) };
}

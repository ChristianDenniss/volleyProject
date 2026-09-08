import { cookies } from "next/headers";
import {
  parseSiteRegion,
  regionQuery,
  SITE_REGION_COOKIE,
  SITE_REGION_PARAM,
  type SiteRegion,
} from "@/lib/region";

export type RegionSearchParams = Record<string, string | string[] | undefined>;

function paramRegion(params: RegionSearchParams | undefined): string | undefined {
  const raw = params?.[SITE_REGION_PARAM];
  return Array.isArray(raw) ? raw[0] : raw;
}

export async function getSiteRegion(params?: RegionSearchParams): Promise<SiteRegion> {
  const fromParam = paramRegion(params);
  if (fromParam !== undefined) return parseSiteRegion(fromParam);

  const jar = await cookies();
  return parseSiteRegion(jar.get(SITE_REGION_COOKIE)?.value);
}

export async function getSiteRegionQuery(params?: RegionSearchParams) {
  const selected = await getSiteRegion(params);
  return { selected, query: regionQuery(selected) };
}

export const SITE_REGIONS = ["all", "na", "eu", "as", "sa"] as const;
export type SiteRegion = (typeof SITE_REGIONS)[number];
export type MatchRegion = Exclude<SiteRegion, "all">;

export const DEFAULT_SITE_REGION: SiteRegion = "na";
export const SITE_REGION_COOKIE = "rvl-region";
export const SITE_REGION_PARAM = "r";
export const SITE_REGION_MAX_AGE = 60 * 60 * 24 * 365;
/** Portal HTTP callers send this so the site region cookie does not hide other regions. */
export const PORTAL_SKIP_REGION_HEADER = "x-rvl-skip-region";

const REGION_SET = new Set<string>(SITE_REGIONS);

export function parseSiteRegion(value: string | undefined | null): SiteRegion {
  const normalized = value?.trim().toLowerCase();
  if (normalized && REGION_SET.has(normalized)) return normalized as SiteRegion;
  return DEFAULT_SITE_REGION;
}

export function siteRegionCookie(region: SiteRegion) {
  return `${SITE_REGION_COOKIE}=${region};path=/;max-age=${SITE_REGION_MAX_AGE};samesite=lax`;
}

export function regionQuery(region: SiteRegion): { region: MatchRegion } | Record<string, never> {
  return region === "all" ? {} : { region };
}

export function matchRegionOf(region: SiteRegion): MatchRegion | undefined {
  return region === "all" ? undefined : region;
}

export function regionParamValue(region: SiteRegion): string | null {
  return region === DEFAULT_SITE_REGION ? null : region;
}

export function withRegionParam(
  params: URLSearchParams | Record<string, string | undefined>,
  region: SiteRegion,
): URLSearchParams {
  const next =
    params instanceof URLSearchParams
      ? new URLSearchParams(params)
      : new URLSearchParams(
          Object.entries(params).flatMap(([key, entry]) =>
            entry === undefined ? [] : [[key, entry] as [string, string]],
          ),
        );

  const value = regionParamValue(region);
  if (value === null) next.delete(SITE_REGION_PARAM);
  else next.set(SITE_REGION_PARAM, value);
  return next;
}

export function hrefWithParams(pathname: string, params: URLSearchParams): string {
  const query = params.toString();
  return query === "" ? pathname : `${pathname}?${query}`;
}

export function regionFromCookieHeader(header: string | null | undefined): MatchRegion | undefined {
  if (!header) return matchRegionOf(parseSiteRegion(undefined));
  const match = header.match(new RegExp(`(?:^|;\\s*)${SITE_REGION_COOKIE}=([^;]+)`));
  const value = match?.[1] ? decodeURIComponent(match[1]) : undefined;
  return matchRegionOf(parseSiteRegion(value));
}

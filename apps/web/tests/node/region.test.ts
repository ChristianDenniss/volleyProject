import { describe, expect, it } from "vitest";
import {
  DEFAULT_SITE_REGION,
  parseSiteRegion,
  regionFromCookieHeader,
  regionQuery,
  SITE_REGION_COOKIE,
  siteRegionCookie,
} from "@/lib/region";

describe("parseSiteRegion", () => {
  it("accepts the known region codes", () => {
    expect(parseSiteRegion("all")).toBe("all");
    expect(parseSiteRegion("ALL")).toBe("all");
    expect(parseSiteRegion("na")).toBe("na");
    expect(parseSiteRegion("EU")).toBe("eu");
    expect(parseSiteRegion(" as ")).toBe("as");
    expect(parseSiteRegion("sa")).toBe("sa");
  });

  it("falls back to NA for missing or unknown values", () => {
    expect(parseSiteRegion(undefined)).toBe(DEFAULT_SITE_REGION);
    expect(parseSiteRegion(null)).toBe(DEFAULT_SITE_REGION);
    expect(parseSiteRegion("latam")).toBe(DEFAULT_SITE_REGION);
  });
});

describe("regionQuery", () => {
  it("omits the filter when every region is selected", () => {
    expect(regionQuery("all")).toEqual({});
    expect(regionQuery("eu")).toEqual({ region: "eu" });
  });
});

describe("siteRegionCookie", () => {
  it("writes a path-scoped preference cookie", () => {
    expect(siteRegionCookie("eu")).toContain(`${SITE_REGION_COOKIE}=eu`);
    expect(siteRegionCookie("eu")).toContain("path=/");
    expect(siteRegionCookie("eu")).toContain("samesite=lax");
  });
});

describe("regionFromCookieHeader", () => {
  it("defaults to NA when the cookie is missing", () => {
    expect(regionFromCookieHeader(undefined)).toBe("na");
    expect(regionFromCookieHeader("")).toBe("na");
    expect(regionFromCookieHeader("sidebar_state=true")).toBe("na");
  });

  it("reads the site cookie among other cookies", () => {
    expect(regionFromCookieHeader(`${SITE_REGION_COOKIE}=eu; sidebar_state=true`)).toBe("eu");
    expect(regionFromCookieHeader(`theme=dark; ${SITE_REGION_COOKIE}=all`)).toBeUndefined();
    expect(regionFromCookieHeader(`${SITE_REGION_COOKIE}=SA`)).toBe("sa");
  });
});

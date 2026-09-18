import { cache } from "react";
import { headers } from "next/headers";
import { getDb } from "@db";
import { logError } from "@server/report";
import {
  siteRegionFromSearchParam,
  SITE_REGION_PARAM,
  type MatchRegion,
} from "@/lib/region";
import type { SearchParams } from "@/lib/search-params";
import { createCaller } from "./root";
import { createContext } from "./context";

async function caller(skipRegion = false) {
  try {
    return createCaller(await createContext(await headers(), { skipRegion }));
  } catch (error) {
    logError("trpc.server", error, { skipRegion });
    throw error;
  }
}

// Memoized per request: building the context resolves the session, so a page that
// calls api() from generateMetadata and again from the component would otherwise
// hit the session store once per call.
export const api = cache(async () => caller());

/** Portal lists skip the site region cookie so admins see every region. */
export const portalApi = cache(async () => caller(true));

/** Anonymous public caller: no cookies/headers, so the page can stay in the ISR cache. */
export const siteApi = cache((region?: MatchRegion) =>
  createCaller({
    db: getDb(),
    user: null,
    ...(region === undefined ? {} : { region }),
  }),
);

export function publicSite(params?: SearchParams | string | string[] | null) {
  const raw =
    params == null || typeof params === "string" || Array.isArray(params)
      ? params
      : params[SITE_REGION_PARAM];
  const { selected, region, query } = siteRegionFromSearchParam(raw);
  return { selected, region, query, trpc: siteApi(region) };
}

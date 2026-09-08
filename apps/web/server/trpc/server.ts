import { cache } from "react";
import { headers } from "next/headers";
import { logError } from "@server/report";
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

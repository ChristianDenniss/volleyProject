import { getDb } from "@db";
import { toTrpcUser } from "@server/auth-user";
import { logError } from "@server/report";
import { getSessionUserFromHeaders } from "@server/session-resolve";
import { isAdmin } from "@server/services/users";
import { PORTAL_SKIP_REGION_HEADER, regionFromCookieHeader } from "@/lib/region";
import type { Context, TrpcUser } from "./init";

function shouldSkipRegion(
  headers: Headers,
  options: { skipRegion?: boolean },
  user: TrpcUser | null,
): boolean {
  if (options.skipRegion && user && isAdmin(user.role)) return true;
  if (headers.get(PORTAL_SKIP_REGION_HEADER) === "1" && user && isAdmin(user.role)) return true;
  return false;
}

export async function createContext(
  headers: Headers,
  options: { skipRegion?: boolean } = {},
): Promise<Context> {
  try {
    const sessionUser = await getSessionUserFromHeaders(headers);
    const user = sessionUser ? toTrpcUser(sessionUser) : null;

    const skipRegion = shouldSkipRegion(headers, options, user);

    return {
      db: getDb(),
      user,
      region: skipRegion ? undefined : regionFromCookieHeader(headers.get("cookie")),
    };
  } catch (error) {
    logError("trpc.context", error);
    throw error;
  }
}

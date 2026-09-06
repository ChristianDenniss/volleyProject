import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { isAdmin } from "./services/users";
import type { SessionUser } from "./auth-user";
import { getSessionUserFromHeaders } from "./session-resolve";

export type { SessionUser } from "./auth-user";
export { getSessionUserFromHeaders } from "./session-resolve";

export async function getSessionUser(): Promise<SessionUser | null> {
  return getSessionUserFromHeaders(await headers());
}

export async function requireSession(returnTo: string): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(returnTo)}`);
  return user;
}

export async function requireAdmin(returnTo: string): Promise<SessionUser> {
  const user = await requireSession(returnTo);
  if (!isAdmin(user.role)) redirect("/");
  return user;
}

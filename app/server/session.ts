import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAuth } from "./auth";
import { isAdmin } from "./services/users";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: string;
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await getAuth().api.getSession({ headers: await headers() });
  if (!session?.user) return null;
  const { id, name, email, image, role } = session.user as unknown as Partial<SessionUser> &
    Pick<SessionUser, "id" | "name" | "email">;
  return { id, name, email, image: image ?? null, role: role ?? "user" };
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

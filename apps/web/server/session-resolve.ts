import { eq } from "drizzle-orm";
import { getDb } from "@db";
import { user as userTable } from "@db/schema";
import { getAuth } from "./auth";
import { isActiveSessionUser, sessionUserFromAuthUser, type SessionUser } from "./auth-user";

export async function getSessionUserFromHeaders(
  requestHeaders: Headers,
): Promise<SessionUser | null> {
  const session = await getAuth().api.getSession({ headers: requestHeaders });
  if (!session?.user) return null;

  const row = await getDb()
    .select({
      id: userTable.id,
      name: userTable.name,
      email: userTable.email,
      image: userTable.image,
      role: userTable.role,
      banned: userTable.banned,
    })
    .from(userTable)
    .where(eq(userTable.id, session.user.id))
    .get();

  if (!row) return null;
  const parsed = sessionUserFromAuthUser({ ...row, image: row.image ?? null });
  return isActiveSessionUser(parsed) ? parsed : null;
}

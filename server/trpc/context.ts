import { getDb } from "@db";
import { getAuth } from "@server/auth";
import type { Context, TrpcUser } from "./init";

export async function createContext(headers: Headers): Promise<Context> {
  const session = await getAuth().api.getSession({ headers });
  const user = session?.user
    ? ({
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        role: (session.user as { role?: string }).role ?? "user",
      } satisfies TrpcUser)
    : null;

  return { db: getDb(), user };
}

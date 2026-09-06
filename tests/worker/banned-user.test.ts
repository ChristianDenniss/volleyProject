import { env } from "cloudflare:test";
import { beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { makeDb, type Db } from "@db";
import { user } from "@db/schema";
import { getSessionUserFromHeaders } from "@server/session-resolve";
import { createContext } from "@server/trpc/context";
import { FIXTURES, seed } from "../fixtures/seed";
import { createSessionFor } from "../helpers/session";

let db: Db;

beforeEach(async () => {
  db = makeDb(env.DB);
  await seed(db);
});

describe("banned users", () => {
  it("treats banned users as signed out in session helpers", async () => {
    await db.update(user).set({ banned: true }).where(eq(user.id, FIXTURES.userId));

    const { headers } = await createSessionFor(db, FIXTURES.userId, env.BETTER_AUTH_SECRET);
    expect(await getSessionUserFromHeaders(headers)).toBeNull();
  });

  it("does not attach banned users to tRPC context", async () => {
    await db.update(user).set({ banned: true }).where(eq(user.id, FIXTURES.userId));

    const { headers } = await createSessionFor(db, FIXTURES.userId, env.BETTER_AUTH_SECRET);
    const ctx = await createContext(headers);
    expect(ctx.user).toBeNull();
  });
});

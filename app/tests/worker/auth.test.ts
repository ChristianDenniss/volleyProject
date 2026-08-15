import { env } from "cloudflare:test";
import { beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { makeDb, type Db } from "@db";
import { account, user } from "@db/schema";
import { buildAuthOptions, makeAuth, type Auth } from "@server/auth";
import { users } from "@server/services";
import { FIXTURES, seed } from "../fixtures/seed";
import { createSessionFor } from "../helpers/session";

const environment = {
  BETTER_AUTH_SECRET: "test-secret-value-for-the-auth-suite",
  BETTER_AUTH_URL: "http://localhost:3000",
  ROBLOX_CLIENT_ID: "test-client-id",
  ROBLOX_CLIENT_SECRET: "test-client-secret",
};

let db: Db;
let auth: Auth;

beforeEach(async () => {
  db = makeDb(env.DB);
  auth = makeAuth(db, environment);
  await seed(db);
});

describe("auth configuration", () => {
  it("offers Roblox and nothing else", () => {
    const options = buildAuthOptions(db, environment);
    expect(Object.keys(options.socialProviders ?? {})).toEqual(["roblox"]);
    expect(options.emailAndPassword?.enabled).toBe(false);
  });

  it("keeps account linking off, so one provider cannot claim another's identity", () => {
    const options = buildAuthOptions(db, environment);
    expect(options.account?.accountLinking?.enabled).toBe(false);
  });
});

describe("sign-in", () => {
  it("sends the browser to Roblox with the registered callback", async () => {
    const result = await auth.api.signInSocial({
      body: { provider: "roblox", callbackURL: "/portal" },
    });

    expect(result.url).toBeDefined();
    const url = new URL(result.url as string);
    expect(url.host).toContain("roblox.com");
    expect(url.searchParams.get("client_id")).toBe(environment.ROBLOX_CLIENT_ID);
    expect(url.searchParams.get("redirect_uri")).toBe(
      "http://localhost:3000/api/auth/callback/roblox",
    );
  });

  it("rejects a provider that is not configured", async () => {
    await expect(
      auth.api.signInSocial({ body: { provider: "github" as never } }),
    ).rejects.toThrow();
  });
});

describe("session", () => {
  it("resolves a stored session from the cookie and carries the role", async () => {
    const { headers } = await createSessionFor(db, FIXTURES.adminId, environment.BETTER_AUTH_SECRET);
    const session = await auth.api.getSession({ headers });

    expect(session?.user.id).toBe(FIXTURES.adminId);
    expect((session?.user as { role?: string }).role).toBe("admin");
  });

  it("returns nothing without a cookie", async () => {
    const session = await auth.api.getSession({ headers: new Headers() });
    expect(session).toBeNull();
  });

  it("returns nothing for a cookie signed with the wrong secret", async () => {
    const { token } = await createSessionFor(db, FIXTURES.userId, environment.BETTER_AUTH_SECRET);
    const forged = `better-auth.session_token=${token}.not-a-real-signature`;
    const session = await auth.api.getSession({ headers: new Headers({ cookie: forged }) });
    expect(session).toBeNull();
  });
});

describe("identity survives a Roblox rename", () => {
  it("keys the account on the provider id, not the name", async () => {
    await db.insert(account).values({
      id: "account-1",
      userId: FIXTURES.userId,
      accountId: "roblox-4815162342",
      providerId: "roblox",
    });

    await db.update(user).set({ name: "renamed", email: "renamed" }).where(eq(user.id, FIXTURES.userId));

    const linked = await db.query.account.findFirst({
      where: eq(account.accountId, "roblox-4815162342"),
    });
    expect(linked?.userId).toBe(FIXTURES.userId);

    const renamed = await users.getById(db, FIXTURES.userId);
    expect(renamed?.name).toBe("renamed");
  });
});

describe("admin bootstrap", () => {
  it("promotes the first account to superadmin the way the bootstrap command does", async () => {
    await env.DB.prepare("update user set role = ? where id = ?")
      .bind("superadmin", FIXTURES.userId)
      .run();

    const promoted = await users.getById(db, FIXTURES.userId);
    expect(promoted?.role).toBe("superadmin");
    expect(users.isAdmin(promoted?.role)).toBe(true);
  });

  it("leaves an ordinary account without admin rights", async () => {
    const plain = await users.getById(db, FIXTURES.userId);
    expect(users.isAdmin(plain?.role)).toBe(false);
  });
});

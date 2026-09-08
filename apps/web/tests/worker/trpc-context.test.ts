import { env } from "cloudflare:test";
import { beforeEach, describe, expect, it } from "vitest";
import { makeDb, type Db } from "@db";
import { createContext } from "@server/trpc/context";
import { FIXTURES, seed } from "../fixtures/seed";
import { createSessionFor } from "../helpers/session";
import { PORTAL_SKIP_REGION_HEADER, SITE_REGION_COOKIE } from "@/lib/region";

let db: Db;

beforeEach(async () => {
  db = makeDb(env.DB);
  await seed(db);
});

describe("createContext region scoping", () => {
  it("ignores the skip-region header for anonymous callers", async () => {
    const headers = new Headers({
      [PORTAL_SKIP_REGION_HEADER]: "1",
      cookie: `${SITE_REGION_COOKIE}=eu`,
    });
    const ctx = await createContext(headers);
    expect(ctx.region).toBe("eu");
  });

  it("ignores the skip-region header for non-admin users", async () => {
    const { headers: sessionHeaders } = await createSessionFor(
      db,
      FIXTURES.userId,
      env.BETTER_AUTH_SECRET,
    );
    const headers = new Headers(sessionHeaders);
    headers.set(PORTAL_SKIP_REGION_HEADER, "1");
    headers.set("cookie", `${headers.get("cookie")}; ${SITE_REGION_COOKIE}=eu`);

    const ctx = await createContext(headers);
    expect(ctx.region).toBe("eu");
  });

  it("honors the skip-region header for admins", async () => {
    const { headers: sessionHeaders } = await createSessionFor(
      db,
      FIXTURES.adminId,
      env.BETTER_AUTH_SECRET,
    );
    const headers = new Headers(sessionHeaders);
    headers.set(PORTAL_SKIP_REGION_HEADER, "1");
    headers.set("cookie", `${headers.get("cookie")}; ${SITE_REGION_COOKIE}=eu`);

    const ctx = await createContext(headers);
    expect(ctx.region).toBeUndefined();
  });
});

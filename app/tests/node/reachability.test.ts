import { createHmac } from "node:crypto";
import { beforeAll, describe, expect, it } from "vitest";
import { routeManifest, type RouteManifestEntry } from "../../route-manifest";
import { FIXTURES } from "../fixtures/seed";

const BASE = process.env.SITE_URL ?? "http://localhost:3000";
const SECRET = process.env.BETTER_AUTH_SECRET ?? "local-development-secret-not-for-production";

const CONCRETE: Record<string, string> = {
  ":id": String(FIXTURES.seasonId),
  ":teamName": encodeURIComponent(FIXTURES.teamName),
};

const ABSENT: Record<string, string> = {
  ":id": String(FIXTURES.missingId),
  ":teamName": FIXTURES.missingTeamName,
};

function fill(path: string, table: Record<string, string>): string {
  return path
    .split("/")
    .map((segment) => (segment.startsWith(":") ? (table[segment] ?? segment) : segment))
    .join("/");
}

function cookieFor(token: string): string {
  const signature = createHmac("sha256", SECRET).update(token).digest("base64");
  return `better-auth.session_token=${encodeURIComponent(`${token}.${signature}`)}`;
}

const ADMIN_COOKIE = cookieFor("t3-admin-token");
const USER_COOKIE = cookieFor("t3-user-token");

async function visit(path: string, cookie?: string) {
  const response = await fetch(`${BASE}${path}`, {
    redirect: "manual",
    headers: cookie ? { cookie } : undefined,
  });
  const body = response.status < 400 ? await response.text() : "";
  return { status: response.status, location: response.headers.get("location"), body };
}

function mainText(html: string): string {
  const match = /<main[^>]*>([\s\S]*?)<\/main>/.exec(html);
  if (!match) return "";
  return match[1].replace(/<[^>]+>/g, "").trim();
}

const buildable = routeManifest.filter((entry) => entry.status !== "removed");
const publicRoutes = buildable.filter((entry) => entry.auth === "public" && entry.path !== "/404");
const dynamicRoutes = buildable.filter((entry) => entry.path.includes(":"));
const sessionRoutes = buildable.filter((entry) => entry.auth === "session");
const adminRoutes = buildable.filter((entry) => entry.auth === "admin");

beforeAll(async () => {
  const response = await fetch(`${BASE}/`).catch(() => null);
  if (!response) {
    throw new Error(
      `T3 needs the app running at ${BASE}. Start it with: pnpm run t3:serve (see package.json)`,
    );
  }
});

describe("T3 reachability — public routes", () => {
  it.each(publicRoutes.map((entry) => [entry.path, entry] as [string, RouteManifestEntry]))(
    "%s answers 200 with content and metadata",
    async (_path, entry) => {
      const { status, body } = await visit(fill(entry.path, CONCRETE));

      expect(status).toBe(200);
      expect(mainText(body).length).toBeGreaterThan(0);
      expect(/<title>[^<]+<\/title>/.test(body)).toBe(true);
      expect(body).toContain('property="og:');
    },
  );
});

describe("T3 reachability — a missing row is a 404, not a page shaped around undefined", () => {
  it.each(dynamicRoutes.map((entry) => [entry.path, entry] as [string, RouteManifestEntry]))(
    "%s answers 404 for an id that is not there",
    async (_path, entry) => {
      const { status } = await visit(fill(entry.path, ABSENT));
      expect(status).toBe(404);
    },
  );

  it("answers 404 for a path that matches nothing at all", async () => {
    const { status } = await visit("/this-route-does-not-exist");
    expect(status).toBe(404);
  });
});

describe("T3 reachability — guarded routes", () => {
  it.each(sessionRoutes.map((entry) => [entry.path, entry] as [string, RouteManifestEntry]))(
    "%s redirects an anonymous visitor to sign in",
    async (_path, entry) => {
      const { status, location } = await visit(entry.path);
      expect(status).toBe(307);
      expect(location).toContain("/login?next=");
    },
  );

  it.each(sessionRoutes.map((entry) => [entry.path, entry] as [string, RouteManifestEntry]))(
    "%s answers 200 for any signed-in account",
    async (_path, entry) => {
      const { status } = await visit(entry.path, USER_COOKIE);
      expect(status).toBe(200);
    },
  );

  it.each(adminRoutes.map((entry) => [entry.path, entry] as [string, RouteManifestEntry]))(
    "%s turns away an anonymous visitor and a plain user, and answers 200 for an admin",
    async (_path, entry) => {
      expect((await visit(entry.path)).status).toBe(307);

      const asUser = await visit(entry.path, USER_COOKIE);
      expect(asUser.status).toBe(307);
      expect(asUser.location).not.toContain("/portal");

      expect((await visit(entry.path, ADMIN_COOKIE)).status).toBe(200);
    },
  );
});

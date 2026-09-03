import { env } from "cloudflare:test";
import { beforeEach, describe, expect, it } from "vitest";
import { TRPCError } from "@trpc/server";
import { makeDb, type Db } from "@db";
import { appRouter, createCaller } from "@server/trpc/root";
import type { Context } from "@server/trpc/init";
import { expectedProcedures, trpcManifest } from "../../trpc-manifest";
import { FIXTURES, seed } from "../fixtures/seed";

let db: Db;

beforeEach(async () => {
  db = makeDb(env.DB);
  await seed(db);
});

interface ProcedureDef {
  type: "query" | "mutation" | "subscription";
}

function procedures(): Map<string, ProcedureDef> {
  const raw = (appRouter as unknown as { _def: { procedures: Record<string, unknown> } })._def
    .procedures;
  const found = new Map<string, ProcedureDef>();
  for (const [path, procedure] of Object.entries(raw)) {
    const def = (procedure as { _def: { type: ProcedureDef["type"] } })._def;
    found.set(path, { type: def.type });
  }
  return found;
}

function context(user: Context["user"]): Context {
  return { db, user };
}

const anonymous = () => createCaller(context(null));
const plainUser = () =>
  createCaller(
    context({ id: FIXTURES.userId, name: "fixtureplayer", email: "fixtureplayer", role: "user" }),
  );

function invoke(caller: ReturnType<typeof createCaller>, path: string): Promise<unknown> {
  const [namespace = "", name = ""] = path.split(".");
  const group = (caller as unknown as Record<string, Record<string, (input: unknown) => Promise<unknown>>>)[
    namespace
  ];
  if (!group?.[name]) throw new Error(`Unknown procedure ${path}`);
  return group[name](undefined);
}

async function codeOf(caller: ReturnType<typeof createCaller>, path: string): Promise<string> {
  try {
    await invoke(caller, path);
    return "NONE";
  } catch (error) {
    return error instanceof TRPCError ? error.code : "OTHER";
  }
}

function mutations(): Map<string, ProcedureDef> {
  return new Map([...procedures()].filter(([, def]) => def.type === "mutation"));
}

describe("the router matches the manifest in both directions", () => {
  it("declares every procedure the manifest promises", () => {
    const declared = procedures();
    const missing = expectedProcedures
      .map((entry) => entry.procedure)
      .filter((path) => !declared.has(path));
    expect(missing, `missing procedures: ${missing.join(", ")}`).toEqual([]);
  });

  it("declares no mutation the manifest does not name", () => {
    const promised = new Set(expectedProcedures.map((entry) => entry.procedure));
    const extra = [...mutations().keys()].filter((path) => !promised.has(path));
    expect(extra, `mutations with no manifest entry: ${extra.join(", ")}`).toEqual([]);
  });
});

describe("authorization sweep", () => {
  const guarded = expectedProcedures.filter((entry) => entry.access !== "public");

  it("covers more than a handful of procedures", () => {
    expect(guarded.length).toBeGreaterThan(30);
  });

  it("rejects every guarded mutation for an anonymous caller", async () => {
    const caller = anonymous();
    const allowed: string[] = [];

    for (const entry of guarded) {
      const code = await codeOf(caller, entry.procedure);
      if (code !== "UNAUTHORIZED") allowed.push(`${entry.procedure} -> ${code}`);
    }

    expect(allowed, `not rejected for an anonymous caller: ${allowed.join(", ")}`).toEqual([]);
  });

  it("rejects every admin mutation for a signed-in non-admin", async () => {
    const caller = plainUser();
    const allowed: string[] = [];

    for (const entry of guarded.filter((procedure) => procedure.access === "admin")) {
      const code = await codeOf(caller, entry.procedure);
      if (code !== "FORBIDDEN") allowed.push(`${entry.procedure} -> ${code}`);
    }

    expect(allowed, `not rejected for a plain user: ${allowed.join(", ")}`).toEqual([]);
  });

  it("lets a signed-in user reach the procedures marked protected", async () => {
    const caller = plainUser();
    const blocked: string[] = [];

    for (const entry of guarded.filter((procedure) => procedure.access === "protected")) {
      const code = await codeOf(caller, entry.procedure);
      if (code === "UNAUTHORIZED" || code === "FORBIDDEN") {
        blocked.push(`${entry.procedure} -> ${code}`);
      }
    }

    expect(blocked, `a protected procedure turned a signed-in user away: ${blocked.join(", ")}`).toEqual(
      [],
    );
  });

  const GUARDED_QUERIES: { procedure: string; access: "protected" | "admin" }[] = [
    { procedure: "articles.listAll", access: "admin" },
    { procedure: "articles.count", access: "admin" },
    { procedure: "awards.count", access: "admin" },
    { procedure: "games.count", access: "admin" },
    { procedure: "matches.count", access: "admin" },
    { procedure: "records.count", access: "admin" },
    { procedure: "records.latestJob", access: "admin" },
    { procedure: "seasons.count", access: "admin" },
    { procedure: "stats.list", access: "admin" },
    { procedure: "stats.count", access: "admin" },
    { procedure: "teams.count", access: "admin" },
    { procedure: "users.list", access: "admin" },
    { procedure: "users.count", access: "admin" },
    { procedure: "users.me", access: "protected" },
  ];

  it("rejects every guarded query for an anonymous caller", async () => {
    const caller = anonymous();
    const allowed: string[] = [];

    for (const entry of GUARDED_QUERIES) {
      const code = await codeOf(caller, entry.procedure);
      if (code !== "UNAUTHORIZED") allowed.push(`${entry.procedure} -> ${code}`);
    }

    expect(allowed, `not rejected for an anonymous caller: ${allowed.join(", ")}`).toEqual([]);
  });

  it("rejects every admin query for a signed-in non-admin", async () => {
    const caller = plainUser();
    const allowed: string[] = [];

    for (const entry of GUARDED_QUERIES.filter((query) => query.access === "admin")) {
      const code = await codeOf(caller, entry.procedure);
      if (code !== "FORBIDDEN") allowed.push(`${entry.procedure} -> ${code}`);
    }

    expect(allowed, `not rejected for a plain user: ${allowed.join(", ")}`).toEqual([]);
  });

  it("guards every query the router exposes outside the public read surface", () => {
    const PUBLIC_QUERIES = new Set([
      "articles.list",
      "articles.byId",
      "articles.likeStatus",
      "awards.list",
      "awards.byId",
      "games.list",
      "games.byId",
      "matches.list",
      "players.list",
      "players.byId",
      "players.memberships",
      "players.count",
      "records.list",
      "records.byMetric",
      "seasons.list",
      "seasons.byId",
      "stats.leaderboard",
      "stats.vectorGraph",
      "teams.list",
      "teams.byName",
      "teams.playersBySeason",
      "trivia.randomPlayer",
      "trivia.randomTeam",
      "trivia.randomSeason",
    ]);
    const declared = new Set(GUARDED_QUERIES.map((entry) => entry.procedure));
    const unclassified = [...procedures().entries()]
      .filter(([, def]) => def.type === "query")
      .map(([path]) => path)
      .filter((path) => !PUBLIC_QUERIES.has(path) && !declared.has(path));

    expect(unclassified, `queries with no access declaration: ${unclassified.join(", ")}`).toEqual(
      [],
    );
  });

  it("lets an anonymous caller reach the procedures marked public", async () => {
    const caller = anonymous();
    const publicEntries = trpcManifest.filter(
      (entry) => entry.access === "public" && entry.procedure !== null,
    );

    for (const entry of publicEntries) {
      const code = await codeOf(caller, entry.procedure as string);
      expect(code, `${entry.procedure} rejected an anonymous caller`).not.toBe("UNAUTHORIZED");
    }
  });
});

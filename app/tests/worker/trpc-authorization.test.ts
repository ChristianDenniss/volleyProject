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
  const [namespace, name] = path.split(".");
  const group = (caller as unknown as Record<string, Record<string, (input: unknown) => Promise<unknown>>>)[
    namespace
  ];
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

describe("the router matches the manifest in both directions", () => {
  it("declares every procedure the manifest promises", () => {
    const declared = procedures();
    const missing = expectedProcedures
      .map((entry) => entry.procedure)
      .filter((path) => !declared.has(path));
    expect(missing, `missing procedures: ${missing.join(", ")}`).toEqual([]);
  });

  it("declares no procedure the manifest does not name", () => {
    const promised = new Set(expectedProcedures.map((entry) => entry.procedure));
    const extra = [...procedures().keys()].filter((path) => !promised.has(path));
    expect(extra, `procedures with no manifest entry: ${extra.join(", ")}`).toEqual([]);
  });

  it("exposes writes only", () => {
    const reads = [...procedures().entries()]
      .filter(([, def]) => def.type !== "mutation")
      .map(([path]) => path);
    expect(reads, `reads belong in RSC, not tRPC: ${reads.join(", ")}`).toEqual([]);
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

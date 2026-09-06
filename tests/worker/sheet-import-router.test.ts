import { env } from "cloudflare:test";
import { beforeEach, describe, expect, it } from "vitest";
import { TRPCError } from "@trpc/server";
import { makeDb, type Db } from "@db";
import { createCaller } from "@server/trpc/root";
import type { Context } from "@server/trpc/init";
import { FIXTURES, seed } from "../fixtures/seed";

let db: Db;

beforeEach(async () => {
  db = makeDb(env.DB);
  await seed(db);
});

function adminCaller() {
  return createCaller({
    db,
    user: {
      id: FIXTURES.adminId,
      name: "fixtureadmin",
      email: "fixtureadmin",
      role: "admin",
    },
  } satisfies Context);
}

function anonymousCaller() {
  return createCaller({ db, user: null } satisfies Context);
}

describe("sheetImport router", () => {
  it("starts an import session for admins", async () => {
    const result = await adminCaller().sheetImport.startSession();
    expect(result.sessionId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
  });

  it("rejects session start for anonymous callers", async () => {
    await expect(anonymousCaller().sheetImport.startSession()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    } satisfies Partial<TRPCError>);
  });

  it("assembles a teams-only preview from inline sources", async () => {
    const preview = await adminCaller().sheetImport.assemblePreview({
      mode: "teams",
      seasonId: FIXTURES.seasonId,
      sources: {
        masterTeams: [{ name: "Import Test Team", region: "na", playerNames: ["import_player"] }],
        masterGames: [],
        regionalTeams: [],
        regionalBlocks: [],
        sourceWarnings: [],
      },
    });

    expect(preview.counts.teams).toBeGreaterThan(0);
    expect(preview.teams.some((team) => team.name === "Import Test Team")).toBe(true);
  });
});

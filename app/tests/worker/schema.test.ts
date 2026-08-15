import { env } from "cloudflare:test";
import { describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { makeDb } from "@db";
import { awards, records, teams, teamsPlayers } from "@db/schema";
import { FIXTURES, seed } from "../fixtures/seed";

describe("baseline schema and fixtures", () => {
  it("applies the seed graph", async () => {
    const db = makeDb(env.DB);
    const ids = await seed(db);

    expect(ids.seasonId).toBe(1);
    expect(await db.$count(teams)).toBe(4);
    expect(await db.$count(teamsPlayers)).toBe(8);
    expect(await db.$count(records)).toBe(3);
  });

  it("cascades a season delete into its teams", async () => {
    const db = makeDb(env.DB);
    await seed(db);

    await env.DB.exec("PRAGMA foreign_keys = ON");
    await db.delete(teams).where(eq(teams.seasonId, FIXTURES.seasonId));

    const remaining = await db.select().from(teams);
    expect(remaining).toHaveLength(2);
  });

  it("rejects an award type outside the check constraint", async () => {
    const db = makeDb(env.DB);
    await seed(db);

    await expect(
      db.insert(awards).values({
        type: "Best Vibes" as never,
        description: "not a real award",
        seasonId: FIXTURES.seasonId,
      }),
    ).rejects.toThrow();
  });

  it("rejects a record rank outside 1..10", async () => {
    const db = makeDb(env.DB);
    await seed(db);

    await expect(
      db.insert(records).values({
        metric: "aces",
        type: "game",
        rank: 11,
        value: 5,
        seasonId: FIXTURES.seasonId,
        playerId: FIXTURES.playerId,
      }),
    ).rejects.toThrow();
  });
});

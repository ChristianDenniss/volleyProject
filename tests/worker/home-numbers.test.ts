import { env } from "cloudflare:test";
import { beforeEach, describe, expect, it } from "vitest";
import { makeDb, type Db } from "@db";
import {
  computeHomeNumbers,
  invalidateHomeNumbers,
  loadHomeNumbers,
} from "@server/services/home-numbers";
import { FIXTURES, seed } from "../fixtures/seed";

let db: Db;

beforeEach(async () => {
  db = makeDb(env.DB);
  await seed(db);
  await invalidateHomeNumbers();
});

describe("home numbers cache", () => {
  it("bundles season leaders, records and faces", async () => {
    const payload = await computeHomeNumbers(db, FIXTURES.seasonId, async (name) => {
      return `https://avatars.test/${name}`;
    });

    expect(payload.seasonId).toBe(FIXTURES.seasonId);
    expect(payload.numbers.length).toBeGreaterThan(0);
    expect(payload.numbers.every((entry) => entry.name in payload.avatars)).toBe(true);
    expect(Object.values(payload.avatars).every((url) => url?.startsWith("https://avatars.test/"))).toBe(
      true,
    );
  });

  it("reuses the cached payload so faces are not fetched again", async () => {
    let calls = 0;
    const avatarFor = async (name: string) => {
      calls += 1;
      return `https://avatars.test/${name}`;
    };

    const first = await loadHomeNumbers(db, FIXTURES.seasonId, { avatarFor });
    const second = await loadHomeNumbers(db, FIXTURES.seasonId, { avatarFor });

    expect(second).toEqual(first);
    expect(calls).toBe(Object.keys(first.avatars).length);
  });

  it("recomputes after invalidation", async () => {
    let calls = 0;
    const avatarFor = async (name: string) => {
      calls += 1;
      return `https://avatars.test/${name}`;
    };

    const first = await loadHomeNumbers(db, FIXTURES.seasonId, { avatarFor });
    const unique = Object.keys(first.avatars).length;
    await invalidateHomeNumbers();
    await loadHomeNumbers(db, FIXTURES.seasonId, { avatarFor });

    expect(calls).toBe(unique * 2);
  });
});

import { describe, expect, it } from "vitest";
import { apiRateLimitBucket, checkRateLimit } from "@server/rate-limit";

describe("checkRateLimit", () => {
  it("allows requests under the limit", async () => {
    const key = `test-${crypto.randomUUID()}`;
    const config = { limit: 3, windowSeconds: 60 };
    expect((await checkRateLimit(key, config)).allowed).toBe(true);
    expect((await checkRateLimit(key, config)).allowed).toBe(true);
    expect((await checkRateLimit(key, config)).allowed).toBe(true);
  });

  it("blocks once the limit is exceeded", async () => {
    const key = `test-${crypto.randomUUID()}`;
    const config = { limit: 2, windowSeconds: 60 };
    await checkRateLimit(key, config);
    await checkRateLimit(key, config);
    const blocked = await checkRateLimit(key, config);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });
});

describe("apiRateLimitBucket", () => {
  it("maps API paths to limit configs", () => {
    expect(apiRateLimitBucket("/api/auth/callback/roblox")).not.toBeNull();
    expect(apiRateLimitBucket("/api/trpc/games.list")).not.toBeNull();
    expect(apiRateLimitBucket("/api/roblox/avatar/player")).not.toBeNull();
    expect(apiRateLimitBucket("/")).toBeNull();
  });
});

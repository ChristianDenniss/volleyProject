import { env } from "cloudflare:test";
import { describe, expect, it } from "vitest";

describe("worker test environment", () => {
  it("exposes the D1 binding", async () => {
    const row = await env.DB.prepare("select 1 as ok").first<{ ok: number }>();
    expect(row?.ok).toBe(1);
  });
});

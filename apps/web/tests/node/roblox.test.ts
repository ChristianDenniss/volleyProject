import { describe, expect, it, vi } from "vitest";
import {
  avatarByUserId,
  avatarByUsername,
  avatarFor,
  avatarHeadshotByUsername,
  numericRobloxUserId,
} from "@server/services/roblox";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("numericRobloxUserId", () => {
  it("reads a bare id or a prefixed account id", () => {
    expect(numericRobloxUserId("327211334")).toBe("327211334");
    expect(numericRobloxUserId("roblox-327211334")).toBe("327211334");
    expect(numericRobloxUserId("")).toBeNull();
    expect(numericRobloxUserId(null)).toBeNull();
  });
});

describe("avatarByUsername", () => {
  it("resolves the full-body thumbnail URL", async () => {
    const fetchImpl = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.includes("/v1/usernames/users")) {
        expect(init?.method).toBe("POST");
        expect(init?.headers).toMatchObject({ "User-Agent": expect.stringContaining("VolleyProject") });
        return jsonResponse({ data: [{ id: 1 }] });
      }
      expect(url).toContain("/v1/users/avatar?userIds=1");
      expect(url).toContain("size=720x720");
      return jsonResponse({ data: [{ imageUrl: "tr.rbxcdn.com/avatar.png", state: "Completed" }] });
    });

    await expect(avatarByUsername("Roblox", fetchImpl as typeof fetch)).resolves.toBe(
      "https://tr.rbxcdn.com/avatar.png",
    );
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("falls through to the proxy when Roblox rejects the request", async () => {
    const fetchImpl = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("users.roblox.com") || url.includes("thumbnails.roblox.com")) {
        return jsonResponse({ error: "blocked" }, 403);
      }
      if (url.includes("users.roproxy.com")) {
        return jsonResponse({ data: [{ id: 42 }] });
      }
      return jsonResponse({ data: [{ imageUrl: "https://tr.rbxcdn.com/proxy.png" }] });
    });

    await expect(avatarByUsername("LuvLate", fetchImpl as typeof fetch)).resolves.toBe(
      "https://tr.rbxcdn.com/proxy.png",
    );
  });

  it("returns null when the username is not a Roblox user", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ data: [] }));
    await expect(avatarByUsername("not-a-real-user-zzz", fetchImpl as typeof fetch)).resolves.toBeNull();
  });

  it("resolves the headshot thumbnail URL", async () => {
    const fetchImpl = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/v1/usernames/users")) {
        return jsonResponse({ data: [{ id: 1 }] });
      }
      expect(url).toContain("/v1/users/avatar-headshot?userIds=1");
      expect(url).toContain("size=150x150");
      return jsonResponse({ data: [{ imageUrl: "tr.rbxcdn.com/headshot.png", state: "Completed" }] });
    });

    await expect(avatarHeadshotByUsername("Roblox", fetchImpl as typeof fetch)).resolves.toBe(
      "https://tr.rbxcdn.com/headshot.png",
    );
  });
});

describe("avatarFor", () => {
  it("prefers a stored Roblox user id over the username lookup", async () => {
    const fetchImpl = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      expect(url).toContain("userIds=327211334");
      expect(url).not.toContain("/usernames/users");
      return jsonResponse({ data: [{ imageUrl: "https://tr.rbxcdn.com/id.png" }] });
    });

    await expect(
      avatarFor({ name: "luvlate", robloxUserId: "327211334" }, fetchImpl as typeof fetch),
    ).resolves.toBe("https://tr.rbxcdn.com/id.png");
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("falls back to the username when the id lookup misses", async () => {
    const fetchImpl = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/users/avatar")) return jsonResponse({ data: [] });
      if (url.includes("/usernames/users")) return jsonResponse({ data: [{ id: 9 }] });
      return jsonResponse({ data: [] });
    });

    const fetchById = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("userIds=9") && url.includes("/users/avatar")) {
        return jsonResponse({ data: [{ imageUrl: "https://tr.rbxcdn.com/name.png" }] });
      }
      return fetchImpl(input);
    });

    await expect(
      avatarFor({ name: "luvlate", robloxUserId: null }, fetchById as typeof fetch),
    ).resolves.toBe("https://tr.rbxcdn.com/name.png");
  });
});

describe("avatarByUserId", () => {
  it("returns null for a non-numeric id", async () => {
    const fetchImpl = vi.fn();
    await expect(avatarByUserId("abc", fetchImpl as typeof fetch)).resolves.toBeNull();
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});

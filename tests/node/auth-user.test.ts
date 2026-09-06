import { describe, expect, it } from "vitest";
import { isActiveSessionUser, sessionUserFromAuthUser } from "@server/auth-user";

describe("sessionUserFromAuthUser", () => {
  it("marks banned users", () => {
    const user = sessionUserFromAuthUser({
      id: "u1",
      name: "player",
      email: "player",
      banned: true,
    });
    expect(user.banned).toBe(true);
    expect(isActiveSessionUser(user)).toBe(false);
  });

  it("accepts active users", () => {
    const user = sessionUserFromAuthUser({
      id: "u1",
      name: "player",
      email: "player",
      banned: false,
    });
    expect(isActiveSessionUser(user)).toBe(true);
  });
});

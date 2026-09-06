import { describe, expect, it } from "vitest";
import { safeInternalPath } from "@/lib/safe-redirect";

describe("safeInternalPath", () => {
  it("allows same-origin paths", () => {
    expect(safeInternalPath("/profile")).toBe("/profile");
    expect(safeInternalPath("/portal/games")).toBe("/portal/games");
  });

  it("rejects protocol-relative and off-site paths", () => {
    expect(safeInternalPath("//evil.com")).toBe("/");
    expect(safeInternalPath("https://evil.com")).toBe("/");
    expect(safeInternalPath("/\\evil.com")).toBe("/");
  });

  it("falls back when next is missing", () => {
    expect(safeInternalPath(undefined)).toBe("/");
    expect(safeInternalPath(null)).toBe("/");
    expect(safeInternalPath("")).toBe("/");
  });
});

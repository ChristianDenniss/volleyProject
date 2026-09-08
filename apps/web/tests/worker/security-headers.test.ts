import { describe, expect, it } from "vitest";
import { applySecurityHeaders } from "@server/security-headers";

describe("applySecurityHeaders", () => {
  it("adds baseline security headers without overwriting existing values", () => {
    const response = applySecurityHeaders(
      new Response("ok", { headers: { "X-Frame-Options": "SAMEORIGIN" } }),
    );
    expect(response.headers.get("X-Frame-Options")).toBe("SAMEORIGIN");
    expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(response.headers.get("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
  });
});

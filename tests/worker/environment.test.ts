import { describe, expect, it } from "vitest";
import { isProductionDeployment } from "@server/environment";

describe("isProductionDeployment", () => {
  it("returns false for localhost auth URLs", () => {
    // BETTER_AUTH_URL comes from .dev.vars in worker tests (localhost:3000)
    expect(isProductionDeployment()).toBe(false);
  });
});

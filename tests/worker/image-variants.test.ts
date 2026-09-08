import { describe, expect, it } from "vitest";
import { IMAGE_VARIANTS, variantKey, scaledHeight, isVariantName } from "@volley/media";
import { deriveVariants, probeImage } from "@server/services/image-variants";

describe("the images service binding", () => {
  it("derives every variant over rpc when none are named", async () => {
    const result = await deriveVariants("uploads/abc123");

    expect(result.key).toBe("uploads/abc123");
    expect(result.variants.map((entry) => entry.variant)).toEqual(Object.keys(IMAGE_VARIANTS));
  });

  it("derives only the requested variants", async () => {
    const result = await deriveVariants("uploads/abc123", { variants: ["thumb"] });

    expect(result.variants).toHaveLength(1);
    expect(result.variants[0]?.variant).toBe("thumb");
    expect(result.variants[0]?.width).toBe(IMAGE_VARIANTS.thumb);
    expect(result.variants[0]?.key).toBe(variantKey("uploads/abc123", "thumb"));
  });

  it("ignores variant names it does not know", async () => {
    const result = await deriveVariants("uploads/abc123", { variants: ["thumb", "billboard"] });

    expect(result.variants.map((entry) => entry.variant)).toEqual(["thumb"]);
  });

  it("probes an object for its dimensions", async () => {
    const probe = await probeImage("uploads/abc123");

    expect(probe.width).toBeGreaterThan(0);
    expect(probe.height).toBeGreaterThan(0);
  });
});

describe("the media contract", () => {
  it("keeps variant keys under the original key", () => {
    expect(variantKey("uploads/abc", "card")).toBe("uploads/abc/card.webp");
  });

  it("scales height while holding the aspect ratio", () => {
    expect(scaledHeight(1600, 900, 160)).toBe(90);
    expect(scaledHeight(0, 0, 160)).toBe(160);
  });

  it("recognises only the declared variants", () => {
    expect(isVariantName("thumb")).toBe(true);
    expect(isVariantName("billboard")).toBe(false);
  });
});

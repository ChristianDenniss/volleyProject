import { env } from "cloudflare:test";
import { beforeEach, describe, expect, it } from "vitest";
import { IMAGE_VARIANTS, originalKey, scaledHeight, variantKey } from "@volley/media";
import { uploadBindings } from "@server/services/uploads";
import { localImages } from "../helpers/images-local";
import { PNG_500X300 } from "../fixtures/images";

const HASH = "a".repeat(64);

function pngBytes(): Uint8Array {
  const binary = atob(PNG_500X300);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

beforeEach(async () => {
  await env.UPLOADS.put(originalKey(HASH), pngBytes());
});

describe("the images rpc binding", () => {
  it("is wired up and exposes the derive and probe calls", () => {
    const bindings = uploadBindings();

    expect(typeof bindings.images.derive).toBe("function");
    expect(typeof bindings.images.probe).toBe("function");
  });
});

describe("variant derivation", () => {
  const images = () => localImages(env.UPLOADS);

  it("derives every variant when none are named", async () => {
    const result = await images().derive(HASH);

    expect(result.hash).toBe(HASH);
    expect(result.width).toBe(500);
    expect(result.height).toBe(300);
    expect(result.variants.map((variant) => variant.name)).toEqual(
      IMAGE_VARIANTS.map((variant) => variant.name),
    );
  });

  it("writes each variant beside the original", async () => {
    const result = await images().derive(HASH);

    for (const variant of result.variants) {
      const stored = await env.UPLOADS.get(variant.key);
      expect(stored, `missing ${variant.key}`).not.toBeNull();
    }
  });

  it("scales down but never up", async () => {
    const result = await images().derive(HASH);
    const wide = result.variants.find((variant) => variant.name === "wide");

    expect(wide?.width).toBe(500);
    expect(wide?.height).toBe(300);
  });

  it("derives only the requested variants", async () => {
    const result = await images().derive(HASH, { variants: ["thumb"] });

    expect(result.variants).toHaveLength(1);
    expect(result.variants[0]?.name).toBe("thumb");
    expect(result.variants[0]?.width).toBe(160);
    expect(result.variants[0]?.key).toBe(variantKey(HASH, "thumb"));
  });

  it("refuses a hash with nothing stored behind it", async () => {
    await expect(images().derive("b".repeat(64))).rejects.toThrow(/no original stored/);
  });

  it("probes the original for its dimensions", async () => {
    const probe = await images().probe(HASH);

    expect(probe.width).toBe(500);
    expect(probe.height).toBe(300);
  });
});

describe("the media contract", () => {
  it("keeps variants beside the original under the hash", () => {
    expect(originalKey(HASH)).toBe(`${HASH}/original`);
    expect(variantKey(HASH, "card")).toBe(`${HASH}/card.webp`);
  });

  it("scales height while holding the aspect ratio", () => {
    expect(scaledHeight(500, 300, 160)).toBe(96);
    expect(scaledHeight(0, 0, 160)).toBe(160);
  });
});

import { env } from "cloudflare:test";
import { beforeEach, describe, expect, it } from "vitest";
import { makeDb, type Db } from "@db";
import { uploads } from "@db/schema";
import { createCaller } from "@server/trpc/root";
import type { Context } from "@server/trpc/init";
import { GET } from "@/app/api/uploads/[...key]/route";
import { UPLOAD_CACHE_CONTROL, UPLOAD_MAX_BASE64_LENGTH, UPLOAD_VARIANTS } from "@/lib/uploads";
import { GIF_120X90, JPEG_500X300, PDF_BYTES, PNG_500X300 } from "../fixtures/images";
import { localImages } from "../helpers/images-local";
import { FIXTURES, seed } from "../fixtures/seed";

function testUploadBindings() {
  return { bucket: env.UPLOADS, images: localImages(env.UPLOADS) };
}

let db: Db;

beforeEach(async () => {
  db = makeDb(env.DB);
  await seed(db);
});

function userCaller() {
  return createCaller({
    db,
    user: { id: FIXTURES.userId, name: "fixtureplayer", email: "fixtureplayer", role: "user" },
    uploads: testUploadBindings(),
  } satisfies Context);
}

function adminCaller() {
  return createCaller({
    db,
    user: { id: FIXTURES.adminId, name: "fixtureadmin", email: "fixtureadmin", role: "admin" },
    uploads: testUploadBindings(),
  } satisfies Context);
}

function anonymousCaller() {
  return createCaller({ db, user: null, uploads: testUploadBindings() } satisfies Context);
}

function serve(key: string, headers?: HeadersInit): Promise<Response> {
  const url = `https://volley.test/api/uploads/${key}`;
  const request = headers === undefined ? new Request(url) : new Request(url, { headers });
  return GET(request, { params: Promise.resolve({ key: key.split("/") }) });
}

async function rowCount(): Promise<number> {
  const rows = await db.select().from(uploads);
  return rows.length;
}

describe("uploads.createArticleImage", () => {
  it("stores the original untouched and derives every configured thumbnail", async () => {
    const result = await userCaller().uploads.createArticleImage({
      filename: "hero.png",
      data: PNG_500X300,
    });

    expect(result.mime).toBe("image/png");
    expect(result.width).toBe(500);
    expect(result.height).toBe(300);
    expect(result.deduped).toBe(false);
    expect(result.key).toBe(`${result.id}/original`);
    expect(result.url).toBe(`/api/uploads/${result.id}/original`);

    const original = await env.UPLOADS.get(result.key);
    expect(original).not.toBeNull();
    expect(original?.size).toBe(result.bytes);
    expect(original?.httpMetadata?.contentType).toBe("image/png");

    expect(result.variants.map((variant) => variant.name)).toEqual(
      UPLOAD_VARIANTS.map((variant) => variant.name),
    );

    const thumb = result.variants.find((variant) => variant.name === "thumb");
    const card = result.variants.find((variant) => variant.name === "card");
    const wide = result.variants.find((variant) => variant.name === "wide");

    expect(thumb?.width).toBe(160);
    expect(card?.width).toBe(480);
    expect(wide?.width).toBe(500);

    for (const variant of result.variants) {
      const object = await env.UPLOADS.get(variant.key);
      expect(object, `missing variant object ${variant.key}`).not.toBeNull();
      expect(object?.httpMetadata?.contentType).toBe("image/webp");
      expect(variant.url).toBe(`/api/uploads/${variant.key}`);
    }
  });

  it("accepts jpeg and gif", async () => {
    const caller = userCaller();
    const jpeg = await caller.uploads.createArticleImage({
      filename: "photo.jpg",
      data: JPEG_500X300,
    });
    const gif = await caller.uploads.createArticleImage({ filename: "loop.gif", data: GIF_120X90 });

    expect(jpeg.mime).toBe("image/jpeg");
    expect(gif.mime).toBe("image/gif");
    expect(gif.width).toBe(120);
    expect(await rowCount()).toBe(2);
  });

  it("rejects a payload over the size limit", async () => {
    await expect(
      userCaller().uploads.createArticleImage({
        filename: "huge.png",
        data: "A".repeat(UPLOAD_MAX_BASE64_LENGTH + 4),
      }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });

    expect(await rowCount()).toBe(0);
  });

  it("rejects bytes that do not sniff as an allowed image, whatever the filename claims", async () => {
    await expect(
      userCaller().uploads.createArticleImage({ filename: "trojan.png", data: PDF_BYTES }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });

    expect(await rowCount()).toBe(0);
  });

  it("dedupes identical bytes onto one content-addressed row", async () => {
    const first = await userCaller().uploads.createArticleImage({
      filename: "hero.png",
      data: PNG_500X300,
    });
    const second = await adminCaller().uploads.createArticleImage({
      filename: "hero-copy.png",
      data: PNG_500X300,
    });

    expect(second.id).toBe(first.id);
    expect(second.key).toBe(first.key);
    expect(second.filename).toBe("hero.png");
    expect(second.deduped).toBe(true);
    expect(await rowCount()).toBe(1);
  });

  it("turns anonymous callers away", async () => {
    await expect(
      anonymousCaller().uploads.createArticleImage({ filename: "hero.png", data: PNG_500X300 }),
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});

describe("uploads.createAsset", () => {
  it("stores team and player artwork for admins", async () => {
    const result = await adminCaller().uploads.createAsset({
      filename: "logo.png",
      data: PNG_500X300,
    });
    expect(result.deduped).toBe(false);
    expect(await rowCount()).toBe(1);
  });

  it("turns a signed-in non-admin away", async () => {
    await expect(
      userCaller().uploads.createAsset({ filename: "logo.png", data: PNG_500X300 }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});

describe("GET /api/uploads/[...key]", () => {
  it("streams the original with its content type, an immutable cache header and an etag", async () => {
    const stored = await userCaller().uploads.createArticleImage({
      filename: "hero.png",
      data: PNG_500X300,
    });

    const response = await serve(stored.key);

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("image/png");
    expect(response.headers.get("Cache-Control")).toBe(UPLOAD_CACHE_CONTROL);
    expect(response.headers.get("ETag")).toBeTruthy();
    expect((await response.arrayBuffer()).byteLength).toBe(stored.bytes);
  });

  it("serves a derived variant as webp", async () => {
    const stored = await userCaller().uploads.createArticleImage({
      filename: "hero.png",
      data: PNG_500X300,
    });
    const thumb = stored.variants.find((variant) => variant.name === "thumb");
    expect(thumb).toBeDefined();

    const response = await serve(thumb?.key ?? "");
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("image/webp");
  });

  it("answers a matching If-None-Match with 304 and no body", async () => {
    const stored = await userCaller().uploads.createArticleImage({
      filename: "hero.png",
      data: PNG_500X300,
    });

    const first = await serve(stored.key);
    const etag = first.headers.get("ETag") ?? "";
    const second = await serve(stored.key, { "If-None-Match": etag });

    expect(second.status).toBe(304);
    expect(second.body).toBeNull();
  });

  it("404s for an unknown object and for a key outside the content-addressed layout", async () => {
    const missing = await serve(`${"a".repeat(64)}/original`);
    expect(missing.status).toBe(404);

    const traversal = await serve("../secrets");
    expect(traversal.status).toBe(404);
  });
});

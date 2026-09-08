import { env } from "cloudflare:test";
import { beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { makeDb, type Db } from "@db";
import { uploads } from "@db/schema";
import { createCaller } from "@server/trpc/root";
import type { Context } from "@server/trpc/init";
import { process as processUpload } from "@server/services/uploads";
import { stagingKeyOf } from "@server/upload-queue";
import { GET } from "@/app/api/uploads/[...key]/route";
import {
  UPLOAD_CACHE_CONTROL,
  UPLOAD_MAX_BYTES,
  UPLOAD_STAGING_PREFIX,
  UPLOAD_VARIANTS,
  type UploadMimeType,
} from "@/lib/uploads";
import { GIF_120X90, JPEG_500X300, PDF_BYTES, PNG_500X300 } from "../fixtures/images";
import { localImages } from "../helpers/images-local";
import { FIXTURES, seed } from "../fixtures/seed";

let db: Db;

function testUploadBindings() {
  return { bucket: env.UPLOADS, images: localImages(env.UPLOADS) };
}

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

function bytesOf(base64: string): Uint8Array {
  return Uint8Array.from(atob(base64), (character) => character.charCodeAt(0));
}

function serve(key: string, headers?: HeadersInit): Promise<Response> {
  const url = `https://volley.test/api/uploads/${key}`;
  const request = headers === undefined ? new Request(url) : new Request(url, { headers });
  return GET(request, { params: Promise.resolve({ key: key.split("/") }) });
}

async function stage(id: string, base64: string): Promise<string> {
  const [row] = await db.select().from(uploads).where(eq(uploads.id, id)).limit(1);
  if (!row) throw new Error("no upload row");
  await env.UPLOADS.put(row.stagingKey, bytesOf(base64));
  return row.stagingKey;
}

async function ticketFor(
  base64: string,
  filename = "hero.png",
  contentType: UploadMimeType = "image/png",
) {
  const ticket = await userCaller().uploads.createArticleImageUrl({
    filename,
    contentType,
    bytes: bytesOf(base64).byteLength,
  });
  await stage(ticket.id, base64);
  return ticket;
}

describe("uploads.createArticleImageUrl", () => {
  it("hands back a presigned PUT for a staging key and records an awaiting row", async () => {
    const ticket = await userCaller().uploads.createArticleImageUrl({
      filename: "hero.png",
      contentType: "image/png",
      bytes: 4096,
    });

    expect(ticket.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(ticket.expiresInSeconds).toBeGreaterThan(0);

    const url = new URL(ticket.url);
    expect(url.hostname).toContain("r2.cloudflarestorage.com");
    expect(url.pathname).toContain(UPLOAD_STAGING_PREFIX);
    expect(url.searchParams.get("X-Amz-Signature")).toBeTruthy();
    expect(url.searchParams.get("X-Amz-Expires")).toBe(String(ticket.expiresInSeconds));

    const state = await userCaller().uploads.status({ id: ticket.id });
    expect(state.status).toBe("awaiting");
    expect(state.url).toBeNull();
  });

  it("refuses a declared size over the limit before signing anything", async () => {
    await expect(
      userCaller().uploads.createArticleImageUrl({
        filename: "huge.png",
        contentType: "image/png",
        bytes: UPLOAD_MAX_BYTES + 1,
      }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("refuses a content type outside the allow list", async () => {
    await expect(
      userCaller().uploads.createArticleImageUrl({
        filename: "doc.pdf",
        contentType: "application/pdf" as "image/png",
        bytes: 1024,
      }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("turns anonymous callers away", async () => {
    await expect(
      anonymousCaller().uploads.createArticleImageUrl({
        filename: "hero.png",
        contentType: "image/png",
        bytes: 1024,
      }),
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("lets only admins presign assets", async () => {
    await expect(
      userCaller().uploads.createAssetUrl({
        filename: "logo.png",
        contentType: "image/png",
        bytes: 1024,
      }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });

    const ticket = await adminCaller().uploads.createAssetUrl({
      filename: "logo.png",
      contentType: "image/png",
      bytes: 1024,
    });
    expect(ticket.url).toBeTruthy();
  });
});

describe("processing an uploaded object", () => {
  it("moves the original to its hash, derives every variant and reports ready", async () => {
    const ticket = await ticketFor(PNG_500X300);
    const stagingKey = `${UPLOAD_STAGING_PREFIX}${ticket.id}`;

    await processUpload(db, stagingKey, testUploadBindings());
    const state = await userCaller().uploads.status({ id: ticket.id });

    expect(state.status).toBe("ready");
    expect(state.width).toBe(500);
    expect(state.height).toBe(300);
    expect(state.url).toMatch(/^\/api\/uploads\/[0-9a-f]{64}\/original$/);

    expect(state.variants.map((variant) => variant.name)).toEqual(
      UPLOAD_VARIANTS.map((variant) => variant.name),
    );

    for (const variant of state.variants) {
      const object = await env.UPLOADS.get(variant.key);
      expect(object, `missing variant ${variant.key}`).not.toBeNull();
    }

    const staged = await env.UPLOADS.get(stagingKey);
    expect(staged, "staging object should be cleaned up").toBeNull();
  });

  it("accepts jpeg and gif", async () => {
    const jpeg = await ticketFor(JPEG_500X300, "photo.jpg", "image/jpeg");
    const gif = await ticketFor(GIF_120X90, "loop.gif", "image/gif");

    await processUpload(db, `${UPLOAD_STAGING_PREFIX}${jpeg.id}`, testUploadBindings());
    await processUpload(db, `${UPLOAD_STAGING_PREFIX}${gif.id}`, testUploadBindings());

    expect((await userCaller().uploads.status({ id: jpeg.id })).status).toBe("ready");

    const gifState = await userCaller().uploads.status({ id: gif.id });
    expect(gifState.status).toBe("ready");
    expect(gifState.width).toBe(120);
  });

  it("fails the row and deletes the object when the bytes are not an allowed image", async () => {
    const ticket = await ticketFor(PDF_BYTES, "trojan.png");
    const stagingKey = `${UPLOAD_STAGING_PREFIX}${ticket.id}`;

    await processUpload(db, stagingKey, testUploadBindings());

    const state = await userCaller().uploads.status({ id: ticket.id });
    expect(state.status).toBe("failed");
    expect(state.error).toContain("image/jpeg");
    expect(await env.UPLOADS.get(stagingKey)).toBeNull();
  });

  it("fails and cleans up when the stored object is over the size limit", async () => {
    const ticket = await userCaller().uploads.createArticleImageUrl({
      filename: "hero.png",
      contentType: "image/png",
      bytes: 1024,
    });
    const stagingKey = `${UPLOAD_STAGING_PREFIX}${ticket.id}`;
    await env.UPLOADS.put(stagingKey, new Uint8Array(UPLOAD_MAX_BYTES + 1));

    await processUpload(db, stagingKey, testUploadBindings());

    const state = await userCaller().uploads.status({ id: ticket.id });
    expect(state.status).toBe("failed");
    expect(await env.UPLOADS.get(stagingKey)).toBeNull();
  });

  it("discards an object that no upload row claims", async () => {
    const orphan = `${UPLOAD_STAGING_PREFIX}not-a-real-upload`;
    await env.UPLOADS.put(orphan, bytesOf(PNG_500X300));

    await processUpload(db, orphan, testUploadBindings());

    expect(await env.UPLOADS.get(orphan)).toBeNull();
  });

  it("is safe to run twice for the same object", async () => {
    const ticket = await ticketFor(PNG_500X300);
    const stagingKey = `${UPLOAD_STAGING_PREFIX}${ticket.id}`;

    await processUpload(db, stagingKey, testUploadBindings());
    await processUpload(db, stagingKey, testUploadBindings());

    const state = await userCaller().uploads.status({ id: ticket.id });
    expect(state.status).toBe("ready");
  });
});

describe("the r2 event message", () => {
  it("takes staging puts and ignores everything else", () => {
    expect(stagingKeyOf({ object: { key: "incoming/abc" }, action: "PutObject" })).toBe(
      "incoming/abc",
    );
    expect(stagingKeyOf({ object: { key: "abc/original" }, action: "PutObject" })).toBeNull();
    expect(stagingKeyOf({ object: { key: "incoming/abc" }, action: "DeleteObject" })).toBeNull();
    expect(stagingKeyOf({})).toBeNull();
  });
});

describe("GET /api/uploads/[...key]", () => {
  async function ready() {
    const ticket = await ticketFor(PNG_500X300);
    await processUpload(db, `${UPLOAD_STAGING_PREFIX}${ticket.id}`, testUploadBindings());
    return userCaller().uploads.status({ id: ticket.id });
  }

  it("streams the original with its content type, an immutable cache header and an etag", async () => {
    const state = await ready();
    const key = (state.url ?? "").replace("/api/uploads/", "");

    const response = await serve(key);

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("image/png");
    expect(response.headers.get("Cache-Control")).toBe(UPLOAD_CACHE_CONTROL);
    expect(response.headers.get("ETag")).toBeTruthy();
  });

  it("serves a derived variant as webp", async () => {
    const state = await ready();
    const thumb = state.variants.find((variant) => variant.name === "thumb");

    const response = await serve(thumb?.key ?? "");
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("image/webp");
  });

  it("answers a matching If-None-Match with 304 and no body", async () => {
    const state = await ready();
    const key = (state.url ?? "").replace("/api/uploads/", "");

    const first = await serve(key);
    const second = await serve(key, { "If-None-Match": first.headers.get("ETag") ?? "" });

    expect(second.status).toBe(304);
    expect(second.body).toBeNull();
  });

  it("404s for an unknown object, a staging key and a traversal attempt", async () => {
    expect((await serve(`${"a".repeat(64)}/original`)).status).toBe(404);
    expect((await serve("incoming/abc")).status).toBe(404);
    expect((await serve("../secrets")).status).toBe(404);
  });
});

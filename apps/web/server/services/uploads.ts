import { env } from "cloudflare:workers";
import { AwsClient } from "aws4fetch";
import { eq } from "drizzle-orm";
import type { Db } from "@db";
import { uploads } from "@db/schema";
import {
  originalKey,
  sniffImageMime,
  uploadUrl,
  UPLOAD_CACHE_CONTROL,
  UPLOAD_KEY_PATTERN,
  UPLOAD_MAX_BYTES,
  UPLOAD_MIME_TYPES,
  UPLOAD_STAGING_PREFIX,
  UPLOAD_URL_TTL_SECONDS,
  type UploadMimeType,
  type UploadStatus,
  type UploadVariant,
} from "@/lib/uploads";
import type { ImagesRpc } from "@volley/media";
import { BadRequestError, NotFoundError } from "./errors";

export interface UploadBindings {
  bucket: R2Bucket;
  images: ImagesRpc;
}

export interface PresignedUpload {
  id: string;
  url: string;
  expiresInSeconds: number;
}

export interface UploadState {
  id: string;
  status: UploadStatus;
  url: string | null;
  width: number | null;
  height: number | null;
  variants: { name: string; key: string; url: string; width: number; height: number }[];
  error: string | null;
}

export interface CreateUploadInput {
  filename: string;
  contentType: string;
  bytes: number;
  uploaderId: string;
}

export function uploadBindings(): UploadBindings {
  const images = (env as unknown as { IMAGES_RPC?: ImagesRpc }).IMAGES_RPC;
  if (!images) throw new Error("the IMAGES_RPC service binding is not configured");
  return { bucket: env.UPLOADS, images };
}

interface SigningConfig {
  accessKeyId: string;
  secretAccessKey: string;
  accountId: string;
  bucket: string;
}

function signingConfig(): SigningConfig {
  const source = env as unknown as Record<string, string | undefined>;
  const accessKeyId = source["R2_ACCESS_KEY_ID"];
  const secretAccessKey = source["R2_SECRET_ACCESS_KEY"];
  const accountId = source["R2_ACCOUNT_ID"];
  const bucket = source["R2_BUCKET_NAME"];

  if (!accessKeyId || !secretAccessKey || !accountId || !bucket) {
    throw new Error("R2 signing credentials are not configured");
  }

  return { accessKeyId, secretAccessKey, accountId, bucket };
}

function isUploadMime(value: string): value is UploadMimeType {
  return (UPLOAD_MIME_TYPES as readonly string[]).includes(value);
}

async function sha256Hex(bytes: Uint8Array<ArrayBuffer>): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function present(row: typeof uploads.$inferSelect): UploadState {
  return {
    id: row.id,
    status: row.status,
    url: row.key === null ? null : uploadUrl(row.key),
    width: row.width,
    height: row.height,
    variants: row.variants.map((variant) => ({ ...variant, url: uploadUrl(variant.key) })),
    error: row.error,
  };
}

export async function createUploadUrl(
  db: Db,
  input: CreateUploadInput,
): Promise<PresignedUpload> {
  if (!isUploadMime(input.contentType)) {
    throw new BadRequestError(`Image must be one of ${UPLOAD_MIME_TYPES.join(", ")}`);
  }
  if (input.bytes <= 0) throw new BadRequestError("Image is empty");
  if (input.bytes > UPLOAD_MAX_BYTES) {
    throw new BadRequestError(`Image is larger than ${UPLOAD_MAX_BYTES} bytes`);
  }

  const config = signingConfig();
  const id = crypto.randomUUID();
  const stagingKey = `${UPLOAD_STAGING_PREFIX}${id}`;

  await db.insert(uploads).values({
    id,
    status: "awaiting",
    stagingKey,
    filename: input.filename,
    declaredMime: input.contentType,
    declaredBytes: input.bytes,
    uploadedBy: input.uploaderId,
  });

  const client = new AwsClient({
    accessKeyId: config.accessKeyId,
    secretAccessKey: config.secretAccessKey,
    service: "s3",
    region: "auto",
  });

  const endpoint = new URL(
    `https://${config.accountId}.r2.cloudflarestorage.com/${config.bucket}/${stagingKey}`,
  );
  endpoint.searchParams.set("X-Amz-Expires", String(UPLOAD_URL_TTL_SECONDS));

  const signed = await client.sign(new Request(endpoint, { method: "PUT" }), {
    aws: { signQuery: true },
  });

  return { id, url: signed.url, expiresInSeconds: UPLOAD_URL_TTL_SECONDS };
}

export async function state(db: Db, id: string): Promise<UploadState> {
  const [row] = await db.select().from(uploads).where(eq(uploads.id, id)).limit(1);
  if (!row) throw new NotFoundError("Upload");
  return present(row);
}

async function fail(
  db: Db,
  id: string,
  stagingKey: string,
  bucket: R2Bucket,
  reason: string,
): Promise<void> {
  await bucket.delete(stagingKey);
  await db.update(uploads).set({ status: "failed", error: reason }).where(eq(uploads.id, id));
}

export async function process(
  db: Db,
  stagingKey: string,
  bindings: UploadBindings = uploadBindings(),
): Promise<UploadState | null> {
  const [row] = await db.select().from(uploads).where(eq(uploads.stagingKey, stagingKey)).limit(1);
  if (!row) {
    await bindings.bucket.delete(stagingKey);
    return null;
  }
  if (row.status === "ready") return present(row);

  await db.update(uploads).set({ status: "processing" }).where(eq(uploads.id, row.id));

  const staged = await bindings.bucket.get(stagingKey);
  if (!staged) {
    await fail(db, row.id, stagingKey, bindings.bucket, "The uploaded object was not found");
    return null;
  }

  if (staged.size > UPLOAD_MAX_BYTES) {
    await fail(
      db,
      row.id,
      stagingKey,
      bindings.bucket,
      `Image is larger than ${UPLOAD_MAX_BYTES} bytes`,
    );
    return null;
  }

  const bytes = new Uint8Array(await staged.arrayBuffer());
  const mime = sniffImageMime(bytes);
  if (mime === null) {
    await fail(
      db,
      row.id,
      stagingKey,
      bindings.bucket,
      `Image must be one of ${UPLOAD_MIME_TYPES.join(", ")}`,
    );
    return null;
  }

  const hash = await sha256Hex(bytes);
  const key = originalKey(hash);

  try {
    await bindings.bucket.put(key, bytes, {
      httpMetadata: { contentType: mime, cacheControl: UPLOAD_CACHE_CONTROL },
    });

    const derived = await bindings.images.derive(hash);
    const variants: UploadVariant[] = derived.variants;

    const [updated] = await db
      .update(uploads)
      .set({
        status: "ready",
        key,
        hash,
        mime,
        bytes: bytes.byteLength,
        width: derived.width,
        height: derived.height,
        variants,
        error: null,
      })
      .where(eq(uploads.id, row.id))
      .returning();

    await bindings.bucket.delete(stagingKey);
    return updated ? present(updated) : null;
  } catch (error) {
    const reason = error instanceof Error ? error.message : "Image could not be processed";
    await fail(db, row.id, stagingKey, bindings.bucket, reason);
    return null;
  }
}

export async function object(
  key: string,
  bindings: UploadBindings = uploadBindings(),
): Promise<R2ObjectBody> {
  if (!UPLOAD_KEY_PATTERN.test(key)) throw new NotFoundError("Upload");
  const found = await bindings.bucket.get(key);
  if (!found) throw new NotFoundError("Upload");
  return found;
}

import { env } from "cloudflare:workers";
import { eq } from "drizzle-orm";
import type { Db } from "@db";
import { uploads } from "@db/schema";
import {
  decodeBase64,
  originalKey,
  sniffImageMime,
  uploadUrl,
  UPLOAD_CACHE_CONTROL,
  UPLOAD_KEY_PATTERN,
  UPLOAD_MAX_BASE64_LENGTH,
  UPLOAD_MAX_BYTES,
  UPLOAD_MIME_TYPES,
  type UploadMimeType,
  type UploadVariant,
} from "@/lib/uploads";
import type { ImagesRpc } from "@volley/media";
import { BadRequestError, NotFoundError } from "./errors";

export interface StoredUploadVariant extends UploadVariant {
  url: string;
}

export interface StoredUpload {
  id: string;
  key: string;
  url: string;
  filename: string;
  mime: UploadMimeType;
  bytes: number;
  width: number;
  height: number;
  variants: StoredUploadVariant[];
  deduped: boolean;
}

export interface UploadBindings {
  bucket: R2Bucket;
  images: ImagesRpc;
}

export interface StoreUploadInput {
  data: string;
  filename: string;
  uploaderId: string;
}

interface UploadRow {
  id: string;
  key: string;
  filename: string;
  mime: UploadMimeType;
  bytes: number;
  width: number;
  height: number;
  variants: UploadVariant[];
}

export function uploadBindings(): UploadBindings {
  const images = (env as unknown as { IMAGES_RPC?: ImagesRpc }).IMAGES_RPC;
  if (!images) throw new Error("the IMAGES_RPC service binding is not configured");
  return { bucket: env.UPLOADS, images };
}

async function sha256Hex(bytes: Uint8Array<ArrayBuffer>): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function present(row: UploadRow, deduped: boolean): StoredUpload {
  return {
    id: row.id,
    key: row.key,
    url: uploadUrl(row.key),
    filename: row.filename,
    mime: row.mime,
    bytes: row.bytes,
    width: row.width,
    height: row.height,
    variants: row.variants.map((variant) => ({ ...variant, url: uploadUrl(variant.key) })),
    deduped,
  };
}

async function findById(db: Db, id: string): Promise<UploadRow | null> {
  const [row] = await db.select().from(uploads).where(eq(uploads.id, id)).limit(1);
  return row ?? null;
}

export async function store(
  db: Db,
  input: StoreUploadInput,
  bindings: UploadBindings = uploadBindings(),
): Promise<StoredUpload> {
  if (input.data.length > UPLOAD_MAX_BASE64_LENGTH) {
    throw new BadRequestError(`Image is larger than ${UPLOAD_MAX_BYTES} bytes`);
  }

  const bytes = decodeBase64(input.data);
  if (bytes === null) throw new BadRequestError("Image data is not valid base64");
  if (bytes.byteLength === 0) throw new BadRequestError("Image is empty");
  if (bytes.byteLength > UPLOAD_MAX_BYTES) {
    throw new BadRequestError(`Image is larger than ${UPLOAD_MAX_BYTES} bytes`);
  }

  const mime = sniffImageMime(bytes);
  if (mime === null) {
    throw new BadRequestError(`Image must be one of ${UPLOAD_MIME_TYPES.join(", ")}`);
  }

  const hash = await sha256Hex(bytes);
  const existing = await findById(db, hash);
  if (existing) return present(existing, true);

  const key = originalKey(hash);

  await bindings.bucket.put(key, bytes, {
    httpMetadata: { contentType: mime, cacheControl: UPLOAD_CACHE_CONTROL },
  });

  const derived = await bindings.images.derive(hash);
  const variants: UploadVariant[] = derived.variants;

  const [written] = await db
    .insert(uploads)
    .values({
      id: hash,
      key,
      filename: input.filename,
      mime,
      bytes: bytes.byteLength,
      width: derived.width,
      height: derived.height,
      variants,
      uploadedBy: input.uploaderId,
    })
    .onConflictDoNothing()
    .returning();

  if (written) return present(written, false);

  const raced = await findById(db, hash);
  if (!raced) throw new BadRequestError("Upload could not be recorded");
  return present(raced, true);
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

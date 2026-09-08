import { env } from "cloudflare:workers";
import { eq } from "drizzle-orm";
import type { Db } from "@db";
import { uploads } from "@db/schema";
import {
  decodeBase64,
  originalKey,
  sniffImageMime,
  uploadUrl,
  variantKey,
  UPLOAD_CACHE_CONTROL,
  UPLOAD_KEY_PATTERN,
  UPLOAD_MAX_BASE64_LENGTH,
  UPLOAD_MAX_BYTES,
  UPLOAD_MIME_TYPES,
  UPLOAD_VARIANTS,
  UPLOAD_VARIANT_FORMAT,
  UPLOAD_VARIANT_QUALITY,
  type UploadMimeType,
  type UploadVariant,
} from "@/lib/uploads";
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
  images: ImagesBinding;
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
  return { bucket: env.UPLOADS, images: env.IMAGES };
}

function bytesStream(bytes: Uint8Array): ReadableStream<Uint8Array> {
  return new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(bytes);
      controller.close();
    },
  });
}

async function sha256Hex(bytes: Uint8Array<ArrayBuffer>): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function measure(
  images: ImagesBinding,
  bytes: Uint8Array,
): Promise<{ width: number; height: number }> {
  const info = await images.info(bytesStream(bytes));
  if (!("width" in info)) throw new BadRequestError("Vector images are not accepted");
  return { width: info.width, height: info.height };
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

async function deriveVariants(
  bindings: UploadBindings,
  hash: string,
  bytes: Uint8Array,
): Promise<UploadVariant[]> {
  const derived: UploadVariant[] = [];

  for (const size of UPLOAD_VARIANTS) {
    const result = await bindings.images
      .input(bytesStream(bytes))
      .transform({ width: size.width, fit: "scale-down" })
      .output({ format: UPLOAD_VARIANT_FORMAT, quality: UPLOAD_VARIANT_QUALITY });

    const output = new Uint8Array(await result.response().arrayBuffer());
    const dimensions = await measure(bindings.images, output);
    const key = variantKey(hash, size.name);

    await bindings.bucket.put(key, output, {
      httpMetadata: { contentType: UPLOAD_VARIANT_FORMAT, cacheControl: UPLOAD_CACHE_CONTROL },
    });

    derived.push({
      name: size.name,
      key,
      width: dimensions.width,
      height: dimensions.height,
      bytes: output.byteLength,
    });
  }

  return derived;
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

  const dimensions = await measure(bindings.images, bytes);
  const key = originalKey(hash);

  await bindings.bucket.put(key, bytes, {
    httpMetadata: { contentType: mime, cacheControl: UPLOAD_CACHE_CONTROL },
  });

  const variants = await deriveVariants(bindings, hash, bytes);

  const [written] = await db
    .insert(uploads)
    .values({
      id: hash,
      key,
      filename: input.filename,
      mime,
      bytes: bytes.byteLength,
      width: dimensions.width,
      height: dimensions.height,
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

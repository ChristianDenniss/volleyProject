import {
  IMAGE_VARIANTS,
  UPLOAD_KEY_PATTERN as MEDIA_KEY_PATTERN,
  VARIANT_CACHE_CONTROL,
  VARIANT_FORMAT,
  VARIANT_QUALITY,
} from "@volley/media";

export const UPLOAD_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;
export type UploadMimeType = (typeof UPLOAD_MIME_TYPES)[number];

export const UPLOAD_STATUSES = ["awaiting", "processing", "ready", "failed"] as const;
export type UploadStatus = (typeof UPLOAD_STATUSES)[number];

export const UPLOAD_STAGING_PREFIX = "incoming/";
export const UPLOAD_URL_TTL_SECONDS = 300;

export const UPLOAD_ACCEPT = UPLOAD_MIME_TYPES.join(",");
export const UPLOAD_MAX_BYTES = 5 * 1024 * 1024;
export const UPLOAD_MAX_BASE64_LENGTH = Math.ceil(UPLOAD_MAX_BYTES / 3) * 4 + 4;

export const UPLOAD_VARIANTS = IMAGE_VARIANTS;
export const UPLOAD_VARIANT_FORMAT = VARIANT_FORMAT;
export const UPLOAD_VARIANT_QUALITY = VARIANT_QUALITY;
export const UPLOAD_CACHE_CONTROL = VARIANT_CACHE_CONTROL;
export const UPLOAD_KEY_PATTERN = MEDIA_KEY_PATTERN;

export interface UploadVariant {
  name: string;
  key: string;
  width: number;
  height: number;
  bytes: number;
}

export { originalKey, variantKey } from "@volley/media";

export function uploadUrl(key: string): string {
  return `/api/uploads/${key}`;
}

export function decodeBase64(value: string): Uint8Array<ArrayBuffer> | null {
  let binary: string;
  try {
    binary = atob(value);
  } catch {
    return null;
  }
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

const MAGIC: { mime: UploadMimeType; offset: number; signature: number[] }[] = [
  { mime: "image/png", offset: 0, signature: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  { mime: "image/jpeg", offset: 0, signature: [0xff, 0xd8, 0xff] },
  { mime: "image/gif", offset: 0, signature: [0x47, 0x49, 0x46, 0x38, 0x37, 0x61] },
  { mime: "image/gif", offset: 0, signature: [0x47, 0x49, 0x46, 0x38, 0x39, 0x61] },
  { mime: "image/webp", offset: 0, signature: [0x52, 0x49, 0x46, 0x46] },
];

function startsWith(bytes: Uint8Array, offset: number, signature: number[]): boolean {
  if (bytes.length < offset + signature.length) return false;
  return signature.every((value, index) => bytes[offset + index] === value);
}

export function sniffImageMime(bytes: Uint8Array): UploadMimeType | null {
  for (const candidate of MAGIC) {
    if (!startsWith(bytes, candidate.offset, candidate.signature)) continue;
    if (candidate.mime === "image/webp") {
      return startsWith(bytes, 8, [0x57, 0x45, 0x42, 0x50]) ? "image/webp" : null;
    }
    return candidate.mime;
  }
  return null;
}

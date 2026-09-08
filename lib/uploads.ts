export const UPLOAD_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;
export type UploadMimeType = (typeof UPLOAD_MIME_TYPES)[number];

export const UPLOAD_ACCEPT = UPLOAD_MIME_TYPES.join(",");
export const UPLOAD_MAX_BYTES = 5 * 1024 * 1024;
export const UPLOAD_MAX_BASE64_LENGTH = Math.ceil(UPLOAD_MAX_BYTES / 3) * 4 + 4;

export const UPLOAD_VARIANTS = [
  { name: "thumb", width: 160 },
  { name: "card", width: 480 },
  { name: "wide", width: 1280 },
] as const;

export const UPLOAD_VARIANT_FORMAT = "image/webp";
export const UPLOAD_VARIANT_QUALITY = 82;
export const UPLOAD_CACHE_CONTROL = "public, max-age=31536000, immutable";
export const UPLOAD_KEY_PATTERN = /^[0-9a-f]{64}\/(?:original|[a-z]+\.webp)$/;

export interface UploadVariant {
  name: string;
  key: string;
  width: number;
  height: number;
  bytes: number;
}

export function originalKey(hash: string): string {
  return `${hash}/original`;
}

export function variantKey(hash: string, name: string): string {
  return `${hash}/${name}.webp`;
}

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

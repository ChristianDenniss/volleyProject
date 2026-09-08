export const IMAGE_VARIANTS = [
  { name: "thumb", width: 160 },
  { name: "card", width: 480 },
  { name: "wide", width: 1280 },
] as const;

export type VariantName = (typeof IMAGE_VARIANTS)[number]["name"];

export const VARIANT_NAMES = IMAGE_VARIANTS.map((variant) => variant.name) as VariantName[];

export const VARIANT_FORMAT = "image/webp";
export const VARIANT_QUALITY = 82;
export const VARIANT_CACHE_CONTROL = "public, max-age=31536000, immutable";

export const HASH_PATTERN = /^[0-9a-f]{64}$/;
export const UPLOAD_KEY_PATTERN = /^[0-9a-f]{64}\/(?:original|[a-z]+\.webp)$/;

export interface ImageVariant {
  name: string;
  key: string;
  width: number;
  height: number;
  bytes: number;
}

export interface DeriveResult {
  hash: string;
  width: number;
  height: number;
  variants: ImageVariant[];
}

export interface DeriveOptions {
  variants?: string[] | undefined;
  force?: boolean | undefined;
}

export interface ImageProbe {
  width: number;
  height: number;
  bytes: number;
}

export interface ImagesRpc {
  derive(hash: string, options?: DeriveOptions): Promise<DeriveResult>;
  probe(hash: string): Promise<ImageProbe>;
}

export function isVariantName(value: string): value is VariantName {
  return VARIANT_NAMES.includes(value as VariantName);
}

export function originalKey(hash: string): string {
  return `${hash}/original`;
}

export function variantKey(hash: string, name: string): string {
  return `${hash}/${name}.webp`;
}

export function scaledHeight(width: number, height: number, target: number): number {
  if (width <= 0 || height <= 0) return target;
  return Math.max(1, Math.round((height / width) * target));
}

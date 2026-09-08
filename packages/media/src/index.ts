export const IMAGE_VARIANTS = {
  thumb: 160,
  card: 480,
  hero: 1200,
} as const;

export type VariantName = keyof typeof IMAGE_VARIANTS;

export const VARIANT_NAMES = Object.keys(IMAGE_VARIANTS) as VariantName[];

export const VARIANT_CONTENT_TYPE = "image/webp";

export const VARIANT_CACHE_CONTROL = "public, max-age=31536000, immutable";

export interface DerivedVariant {
  variant: VariantName;
  key: string;
  width: number;
  height: number;
  bytes: number;
  reused: boolean;
}

export interface DeriveResult {
  key: string;
  width: number;
  height: number;
  variants: DerivedVariant[];
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
  derive(key: string, options?: DeriveOptions): Promise<DeriveResult>;
  probe(key: string): Promise<ImageProbe>;
}

export function isVariantName(value: string): value is VariantName {
  return Object.hasOwn(IMAGE_VARIANTS, value);
}

export function variantKey(originalKey: string, variant: VariantName): string {
  return `${originalKey}/${variant}.webp`;
}

export function scaledHeight(width: number, height: number, target: number): number {
  if (width <= 0 || height <= 0) return target;
  return Math.max(1, Math.round((height / width) * target));
}

import { WorkerEntrypoint } from "cloudflare:workers";
import { PhotonImage, SamplingFilter, resize } from "@cf-wasm/photon";
import {
  IMAGE_VARIANTS,
  isVariantName,
  scaledHeight,
  VARIANT_CACHE_CONTROL,
  VARIANT_CONTENT_TYPE,
  VARIANT_NAMES,
  variantKey,
  type DeriveOptions,
  type DerivedVariant,
  type DeriveResult,
  type ImageProbe,
  type VariantName,
} from "@volley/media";

interface Env {
  UPLOADS: R2Bucket;
}

function decodeVariants(requested: string[] | undefined): VariantName[] {
  if (!requested || requested.length === 0) return VARIANT_NAMES;

  const names = requested.filter(isVariantName);
  if (names.length === 0) throw new Error("no known variant names were requested");
  return [...new Set(names)];
}

export class ImagesWorker extends WorkerEntrypoint<Env> {
  async derive(key: string, options: DeriveOptions = {}): Promise<DeriveResult> {
    const wanted = decodeVariants(options.variants);

    const original = await this.env.UPLOADS.get(key);
    if (!original) throw new Error(`no object stored at ${key}`);

    const source = new Uint8Array(await original.arrayBuffer());
    const decoded = PhotonImage.new_from_byteslice(source);

    try {
      const width = decoded.get_width();
      const height = decoded.get_height();
      const derived: DerivedVariant[] = [];

      for (const variant of wanted) {
        const target = IMAGE_VARIANTS[variant];
        const objectKey = variantKey(key, variant);

        if (!options.force) {
          const existing = await this.env.UPLOADS.head(objectKey);
          if (existing) {
            derived.push({
              variant,
              key: objectKey,
              width: Number(existing.customMetadata?.["width"] ?? 0),
              height: Number(existing.customMetadata?.["height"] ?? 0),
              bytes: existing.size,
              reused: true,
            });
            continue;
          }
        }

        const targetWidth = Math.min(target, width);
        const targetHeight = scaledHeight(width, height, targetWidth);
        const resized = resize(decoded, targetWidth, targetHeight, SamplingFilter.Lanczos3);

        try {
          const bytes = resized.get_bytes_webp();
          await this.env.UPLOADS.put(objectKey, bytes, {
            httpMetadata: {
              contentType: VARIANT_CONTENT_TYPE,
              cacheControl: VARIANT_CACHE_CONTROL,
            },
            customMetadata: {
              width: String(targetWidth),
              height: String(targetHeight),
              source: key,
            },
          });

          derived.push({
            variant,
            key: objectKey,
            width: targetWidth,
            height: targetHeight,
            bytes: bytes.byteLength,
            reused: false,
          });
        } finally {
          resized.free();
        }
      }

      return { key, width, height, variants: derived };
    } finally {
      decoded.free();
    }
  }

  async probe(key: string): Promise<ImageProbe> {
    const original = await this.env.UPLOADS.get(key);
    if (!original) throw new Error(`no object stored at ${key}`);

    const source = new Uint8Array(await original.arrayBuffer());
    const decoded = PhotonImage.new_from_byteslice(source);

    try {
      return {
        width: decoded.get_width(),
        height: decoded.get_height(),
        bytes: source.byteLength,
      };
    } finally {
      decoded.free();
    }
  }

  override async fetch(): Promise<Response> {
    return new Response("volley-images is an RPC service", { status: 405 });
  }
}

export default ImagesWorker;

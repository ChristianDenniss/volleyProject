import { WorkerEntrypoint } from "cloudflare:workers";
import { PhotonImage, SamplingFilter, resize } from "@cf-wasm/photon";
import {
  HASH_PATTERN,
  IMAGE_VARIANTS,
  isVariantName,
  originalKey,
  scaledHeight,
  variantKey,
  VARIANT_CACHE_CONTROL,
  VARIANT_FORMAT,
  type DeriveOptions,
  type DeriveResult,
  type ImageProbe,
  type ImageVariant,
} from "@volley/media";

interface Env {
  UPLOADS: R2Bucket;
}

function requestedVariants(requested: string[] | undefined) {
  if (!requested || requested.length === 0) return IMAGE_VARIANTS;

  const wanted = new Set(requested.filter(isVariantName));
  if (wanted.size === 0) throw new Error("no known variant names were requested");
  return IMAGE_VARIANTS.filter((variant) => wanted.has(variant.name));
}

async function loadOriginal(bucket: R2Bucket, hash: string): Promise<Uint8Array> {
  if (!HASH_PATTERN.test(hash)) throw new Error(`${hash} is not a content hash`);

  const stored = await bucket.get(originalKey(hash));
  if (!stored) throw new Error(`no original stored for ${hash}`);

  return new Uint8Array(await stored.arrayBuffer());
}

export class ImagesWorker extends WorkerEntrypoint<Env> {
  async derive(hash: string, options: DeriveOptions = {}): Promise<DeriveResult> {
    const wanted = requestedVariants(options.variants);
    const source = await loadOriginal(this.env.UPLOADS, hash);
    const decoded = PhotonImage.new_from_byteslice(source);

    try {
      const width = decoded.get_width();
      const height = decoded.get_height();
      const variants: ImageVariant[] = [];

      for (const variant of wanted) {
        const key = variantKey(hash, variant.name);

        if (!options.force) {
          const existing = await this.env.UPLOADS.head(key);
          if (existing) {
            variants.push({
              name: variant.name,
              key,
              width: Number(existing.customMetadata?.["width"] ?? 0),
              height: Number(existing.customMetadata?.["height"] ?? 0),
              bytes: existing.size,
            });
            continue;
          }
        }

        const targetWidth = Math.min(variant.width, width);
        const targetHeight = scaledHeight(width, height, targetWidth);
        const resized = resize(decoded, targetWidth, targetHeight, SamplingFilter.Lanczos3);

        try {
          const bytes = resized.get_bytes_webp();
          await this.env.UPLOADS.put(key, bytes, {
            httpMetadata: { contentType: VARIANT_FORMAT, cacheControl: VARIANT_CACHE_CONTROL },
            customMetadata: { width: String(targetWidth), height: String(targetHeight) },
          });

          variants.push({
            name: variant.name,
            key,
            width: targetWidth,
            height: targetHeight,
            bytes: bytes.byteLength,
          });
        } finally {
          resized.free();
        }
      }

      return { hash, width, height, variants };
    } finally {
      decoded.free();
    }
  }

  async probe(hash: string): Promise<ImageProbe> {
    const source = await loadOriginal(this.env.UPLOADS, hash);
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

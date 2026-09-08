import {
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
  type ImagesRpc,
  type ImageVariant,
} from "@volley/media";

function readDimensions(bytes: Uint8Array): { width: number; height: number } {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

  if (bytes[0] === 0x89 && bytes[1] === 0x50) {
    return { width: view.getUint32(16), height: view.getUint32(20) };
  }

  if (bytes[0] === 0x47 && bytes[1] === 0x49) {
    return { width: view.getUint16(6, true), height: view.getUint16(8, true) };
  }

  if (bytes[0] === 0xff && bytes[1] === 0xd8) {
    let offset = 2;
    while (offset < bytes.byteLength - 9) {
      if (bytes[offset] !== 0xff) {
        offset += 1;
        continue;
      }

      const marker = bytes[offset + 1] ?? 0;
      const isFrame = marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker);
      if (isFrame) {
        return { height: view.getUint16(offset + 5), width: view.getUint16(offset + 7) };
      }

      offset += 2 + view.getUint16(offset + 2);
    }
  }

  throw new Error("could not read image dimensions");
}

async function loadOriginal(bucket: R2Bucket, hash: string): Promise<Uint8Array> {
  const stored = await bucket.get(originalKey(hash));
  if (!stored) throw new Error(`no original stored for ${hash}`);
  return new Uint8Array(await stored.arrayBuffer());
}

export function localImages(bucket: R2Bucket): ImagesRpc {
  return {
    async derive(hash: string, options: DeriveOptions = {}): Promise<DeriveResult> {
      const requested = options.variants?.filter(isVariantName);
      const wanted =
        requested && requested.length > 0
          ? IMAGE_VARIANTS.filter((variant) => requested.includes(variant.name))
          : IMAGE_VARIANTS;

      const source = await loadOriginal(bucket, hash);
      const { width, height } = readDimensions(source);
      const variants: ImageVariant[] = [];

      for (const variant of wanted) {
        const key = variantKey(hash, variant.name);
        const targetWidth = Math.min(variant.width, width);
        const targetHeight = scaledHeight(width, height, targetWidth);
        const body = new Uint8Array(Math.max(32, targetWidth));

        await bucket.put(key, body, {
          httpMetadata: { contentType: VARIANT_FORMAT, cacheControl: VARIANT_CACHE_CONTROL },
          customMetadata: { width: String(targetWidth), height: String(targetHeight) },
        });

        variants.push({
          name: variant.name,
          key,
          width: targetWidth,
          height: targetHeight,
          bytes: body.byteLength,
        });
      }

      return { hash, width, height, variants };
    },

    async probe(hash: string): Promise<ImageProbe> {
      const source = await loadOriginal(bucket, hash);
      const { width, height } = readDimensions(source);
      return { width, height, bytes: source.byteLength };
    },
  };
}

import { WorkerEntrypoint } from "cloudflare:workers";

const VARIANTS = [
  { name: "thumb", width: 160 },
  { name: "card", width: 480 },
  { name: "wide", width: 1280 },
];

const HASH_PATTERN = /^[0-9a-f]{64}$/;

function readDimensions(bytes) {
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
      const marker = bytes[offset + 1];
      const isFrame = marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker);
      if (isFrame) {
        return { height: view.getUint16(offset + 5), width: view.getUint16(offset + 7) };
      }
      offset += 2 + view.getUint16(offset + 2);
    }
  }

  throw new Error("stub could not read image dimensions");
}

function scaledHeight(width, height, target) {
  if (width <= 0 || height <= 0) return target;
  return Math.max(1, Math.round((height / width) * target));
}

async function loadOriginal(bucket, hash) {
  if (!HASH_PATTERN.test(hash)) throw new Error(`${hash} is not a content hash`);

  const stored = await bucket.get(`${hash}/original`);
  if (!stored) throw new Error(`no original stored for ${hash}`);

  return new Uint8Array(await stored.arrayBuffer());
}

export class ImagesWorker extends WorkerEntrypoint {
  async derive(hash, options = {}) {
    const names = new Set(options.variants ?? VARIANTS.map((variant) => variant.name));
    const wanted = VARIANTS.filter((variant) => names.has(variant.name));
    if (wanted.length === 0) throw new Error("no known variant names were requested");

    const source = await loadOriginal(this.env.UPLOADS, hash);
    const { width, height } = readDimensions(source);
    const variants = [];

    for (const variant of wanted) {
      const key = `${hash}/${variant.name}.webp`;
      const targetWidth = Math.min(variant.width, width);
      const targetHeight = scaledHeight(width, height, targetWidth);
      const body = new Uint8Array(Math.max(32, targetWidth));

      await this.env.UPLOADS.put(key, body, {
        httpMetadata: {
          contentType: "image/webp",
          cacheControl: "public, max-age=31536000, immutable",
        },
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
  }

  async probe(hash) {
    const source = await loadOriginal(this.env.UPLOADS, hash);
    const { width, height } = readDimensions(source);
    return { width, height, bytes: source.byteLength };
  }

  async fetch() {
    return new Response("stub", { status: 405 });
  }
}

export default ImagesWorker;

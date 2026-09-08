import { WorkerEntrypoint } from "cloudflare:workers";

const VARIANTS = { thumb: 160, card: 480, hero: 1200 };

export class ImagesWorker extends WorkerEntrypoint {
  async derive(key, options = {}) {
    const wanted =
      options.variants && options.variants.length > 0
        ? options.variants.filter((name) => name in VARIANTS)
        : Object.keys(VARIANTS);

    return {
      key,
      width: 1600,
      height: 900,
      variants: wanted.map((variant) => ({
        variant,
        key: `${key}/${variant}.webp`,
        width: VARIANTS[variant],
        height: Math.round((900 / 1600) * VARIANTS[variant]),
        bytes: VARIANTS[variant] * 10,
        reused: false,
      })),
    };
  }

  async probe(key) {
    return { width: 1600, height: 900, bytes: key.length };
  }

  async fetch() {
    return new Response("stub", { status: 405 });
  }
}

export default ImagesWorker;

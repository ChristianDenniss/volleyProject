import { env } from "cloudflare:workers";
import type {
  DeriveOptions,
  DeriveResult,
  ImageProbe,
  ImagesRpc,
} from "@volley/media";

function service(): ImagesRpc {
  const binding = (env as unknown as { IMAGES?: ImagesRpc }).IMAGES;
  if (!binding) throw new Error("the IMAGES service binding is not configured");
  return binding;
}

export function deriveVariants(key: string, options: DeriveOptions = {}): Promise<DeriveResult> {
  return service().derive(key, options);
}

export function probeImage(key: string): Promise<ImageProbe> {
  return service().probe(key);
}

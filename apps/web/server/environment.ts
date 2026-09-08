import { env } from "cloudflare:workers";

export function canonicalOrigin(): string | undefined {
  try {
    return new URL(env.BETTER_AUTH_URL).origin;
  } catch {
    return undefined;
  }
}

/** True when running against a non-local deployment (production or staging). */
export function isProductionDeployment(): boolean {
  try {
    const host = new URL(env.BETTER_AUTH_URL).hostname;
    return host !== "localhost" && host !== "127.0.0.1";
  } catch {
    return true;
  }
}

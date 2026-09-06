import { env } from "cloudflare:workers";

/** True when running against a non-local deployment (production or staging). */
export function isProductionDeployment(): boolean {
  try {
    const host = new URL(env.BETTER_AUTH_URL).hostname;
    return host !== "localhost" && host !== "127.0.0.1";
  } catch {
    return true;
  }
}

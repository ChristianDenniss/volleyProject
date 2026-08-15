import { env } from "cloudflare:test";
import { beforeEach } from "vitest";
import { applyMigrations } from "../helpers/migrate";

beforeEach(async () => {
  await applyMigrations(env.DB);
});

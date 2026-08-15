import { env } from "cloudflare:test";
import { beforeEach } from "vitest";
import { applyMigrations, resetTables } from "../helpers/migrate";

beforeEach(async () => {
  await applyMigrations(env.DB);
  await resetTables(env.DB);
});

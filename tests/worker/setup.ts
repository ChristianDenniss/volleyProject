import { env } from "cloudflare:test";
import { beforeEach } from "vitest";
import { invalidateSiteReads } from "@server/services/site-read-cache";
import { applyMigrations, resetTables } from "../helpers/migrate";

beforeEach(async () => {
  await applyMigrations(env.DB);
  await resetTables(env.DB);
  await invalidateSiteReads();
});

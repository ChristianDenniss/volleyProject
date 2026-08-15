import { applyD1Migrations, env } from "cloudflare:test";

export async function applyMigrations(db: D1Database = env.DB): Promise<void> {
  await applyD1Migrations(db, env.TEST_MIGRATIONS);
}

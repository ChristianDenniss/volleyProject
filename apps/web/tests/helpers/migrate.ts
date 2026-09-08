import { applyD1Migrations, env } from "cloudflare:test";

export async function applyMigrations(db: D1Database = env.DB): Promise<void> {
  await applyD1Migrations(db, env.TEST_MIGRATIONS);
}

export async function resetTables(db: D1Database = env.DB): Promise<void> {
  const { results } = await db
    .prepare(
      "select name from sqlite_master where type = 'table' and name not like 'sqlite_%' and name not like '_cf_%' and name != 'd1_migrations'",
    )
    .all<{ name: string }>();

  if (results.length === 0) return;

  await db.batch([
    db.prepare("PRAGMA defer_foreign_keys = ON"),
    ...results.map((row) => db.prepare(`delete from "${row.name}"`)),
    ...results.map((row) => db.prepare("delete from sqlite_sequence where name = ?").bind(row.name)),
  ]);
}

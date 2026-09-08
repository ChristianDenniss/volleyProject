import fs from "node:fs";
import path from "node:path";
import { drizzle } from "drizzle-orm/sqlite-proxy";
import * as schema from "../server/db/schema";
import { seedDev } from "../tests/fixtures/dev-seed";
import type { Db } from "../server/db";

const outFile = path.join(import.meta.dirname, "..", "tests", "fixtures", "seed.sql");

function quote(value: unknown): string {
  if (value === null || value === undefined) return "null";
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return value ? "1" : "0";
  if (value instanceof Date) return String(value.getTime());
  return `'${String(value).replace(/'/g, "''")}'`;
}

function inline(query: string, params: unknown[]): string {
  let index = 0;
  return query.replace(/\?/g, () => quote(params[index++]));
}

function snakeIdentifiers(query: string): string {
  return query.replace(/"([A-Za-z][A-Za-z0-9]*)"/g, (_match, identifier: string) =>
    `"${identifier.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)}"`,
  );
}

async function main(): Promise<void> {
  const statements: string[] = [];

  const db = drizzle(
    async (query, params) => {
      statements.push(`${snakeIdentifiers(inline(query, params))};`);
      return { rows: [] };
    },
    { schema, casing: "snake_case" },
  ) as unknown as Db;

  await seedDev(db);

  const header = [
    "delete from article_likes;",
    "delete from articles;",
    "delete from awards_players;",
    "delete from awards;",
    "delete from records;",
    "delete from stats;",
    "delete from teams_games;",
    "delete from teams_players;",
    "delete from game_staff;",
    "delete from games;",
    "delete from teams;",
    "delete from players;",
    "delete from seasons;",
    "delete from session;",
    "delete from account;",
    "delete from user;",
    "delete from job_runs;",
    "delete from sqlite_sequence;",
  ];

  fs.writeFileSync(outFile, `${[...header, ...statements].join("\n")}\n`);
  process.stdout.write(`wrote ${path.relative(process.cwd(), outFile)} (${statements.length} inserts)\n`);
}

await main();

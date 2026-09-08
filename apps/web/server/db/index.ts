import { drizzle } from "drizzle-orm/d1";
import { env } from "cloudflare:workers";
import { instrumentD1 } from "./instrument";
import * as schema from "./schema";

export type Db = ReturnType<typeof makeDb>;

export function makeDb(binding: D1Database) {
  return drizzle(instrumentD1(binding), { schema, casing: "snake_case" });
}

export function getD1(): D1Database {
  return instrumentD1(env.DB);
}

export function getDb(): Db {
  return makeDb(env.DB);
}

export { schema };
export * from "./schema";
export { withQueryStats, currentQueryStats } from "./instrument";

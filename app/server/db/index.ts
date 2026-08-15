import { drizzle } from "drizzle-orm/d1";
import { env } from "cloudflare:workers";
import * as schema from "./schema";

export type Db = ReturnType<typeof makeDb>;

export function makeDb(binding: D1Database) {
  return drizzle(binding, { schema, casing: "snake_case" });
}

export function getDb(): Db {
  return makeDb(env.DB);
}

export { schema };
export * from "./schema";

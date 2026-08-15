import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "sqlite",
  driver: "d1-http",
  schema: "./server/db/schema.ts",
  out: "./drizzle",
  casing: "snake_case",
  verbose: true,
  strict: true,
});

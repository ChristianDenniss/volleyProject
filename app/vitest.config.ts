import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import { cloudflareTest, readD1Migrations } from "@cloudflare/vitest-pool-workers";

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url));

const alias = {
  "@db": r("./server/db"),
  "@server": r("./server"),
  "@components": r("./components"),
  "@": r("./"),
};

export default defineConfig({
  test: {
    projects: [
      {
        resolve: {
          alias: { ...alias, "next/cache": r("./tests/helpers/next-cache-stub.ts") },
        },
        plugins: [
          cloudflareTest(async () => ({
            main: r("./tests/helpers/test-worker.ts"),
            wrangler: { configPath: "./wrangler.jsonc" },
            miniflare: {
              compatibilityFlags: ["nodejs_compat"],
              bindings: { TEST_MIGRATIONS: await readD1Migrations(r("./drizzle")) },
            },
          })),
        ],
        test: {
          name: "worker",
          include: ["tests/worker/**/*.test.ts"],
          setupFiles: ["./tests/worker/setup.ts"],
        },
      },
      {
        resolve: { alias },
        test: {
          name: "node",
          environment: "node",
          include: ["tests/node/**/*.test.ts"],
        },
      },
    ],
  },
});

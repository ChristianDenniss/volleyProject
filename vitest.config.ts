import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import { cloudflareTest, readD1Migrations } from "@cloudflare/vitest-pool-workers";
import react from "@vitejs/plugin-react";

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url));

const alias = [
  { find: /^@db$/, replacement: r("./server/db") },
  { find: /^@db\//, replacement: `${r("./server/db")}/` },
  { find: /^@server$/, replacement: r("./server") },
  { find: /^@server\//, replacement: `${r("./server")}/` },
  { find: /^@components\//, replacement: `${r("./components")}/` },
  { find: /^@\//, replacement: `${r("./")}/` },
];

export default defineConfig({
  test: {
    projects: [
      {
        resolve: {
          alias: [{ find: /^next\/cache$/, replacement: r("./tests/helpers/next-cache-stub.ts") }, ...alias],
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
      {
        plugins: [react()],
        resolve: { alias },
        test: {
          name: "dom",
          environment: "jsdom",
          include: ["tests/dom/**/*.test.tsx"],
          setupFiles: ["./tests/dom/setup.ts"],
        },
      },
    ],
  },
});

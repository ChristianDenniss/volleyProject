import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import vinext from "vinext";
import { cloudflare } from "@cloudflare/vite-plugin";
import { cdnAdapter } from "@vinext/cloudflare/cache/cdn-adapter";

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  resolve: {
    alias: [
      { find: /^@db$/, replacement: r("./server/db") },
      { find: /^@db\//, replacement: `${r("./server/db")}/` },
      { find: /^@server$/, replacement: r("./server") },
      { find: /^@server\//, replacement: `${r("./server")}/` },
      { find: /^@components\//, replacement: `${r("./components")}/` },
      { find: /^@\//, replacement: `${r("./")}/` },
    ],
  },
  plugins: [
    vinext({
      cache: { cdn: cdnAdapter() },
    }),
    cloudflare({
      viteEnvironment: {
        name: "rsc",
        childEnvironments: ["ssr"],
      },
    }),
  ],
});

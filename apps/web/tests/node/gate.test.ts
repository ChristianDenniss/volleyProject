import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { routeManifest } from "../../route-manifest";
import { trpcManifest } from "../../trpc-manifest";

const root = path.join(import.meta.dirname, "..", "..");
const scanned = ["app", "server", "components", "lib", "tooling", "tests"];
const skip = new Set(["node_modules", "dist", ".next", ".vinext", ".wrangler", "ui"]);

function sourceFiles(): string[] {
  const found: string[] = [];
  const walk = (dir: string) => {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (skip.has(entry.name)) continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.(ts|tsx|css)$/.test(entry.name)) found.push(full);
    }
  };
  for (const dir of scanned) walk(path.join(root, dir));
  return found;
}

describe("T4 nothing left at the gate", () => {
  it("has no route left todo", () => {
    const open = routeManifest.filter((entry) => entry.status === "todo").map((entry) => entry.path);
    expect(open, `routes still todo: ${open.join(", ")}`).toEqual([]);
  });

  it("has no procedure left todo", () => {
    const open = trpcManifest
      .filter((entry) => entry.status === "todo")
      .map((entry) => entry.endpoint);
    expect(open, `procedures still todo: ${open.join(", ")}`).toEqual([]);
  });

  it("has no TODO marker in the new application source", () => {
    const offenders = sourceFiles()
      .filter((file) => /\bTODO\b|\bFIXME\b/.test(fs.readFileSync(file, "utf8")))
      .map((file) => path.relative(root, file))
      .filter((file) => file !== path.join("tests", "node", "gate.test.ts"));
    expect(offenders, `TODO markers in: ${offenders.join(", ")}`).toEqual([]);
  });
});

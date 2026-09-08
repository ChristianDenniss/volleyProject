import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const root = fileURLToPath(new URL("../..", import.meta.url));

const SCANNED = ["app", "components", "hooks", "lib"];

const RESTRICTED = [
  /^@db(\/|$)/,
  /^@server(\/|$)/,
  /(^|\/)server\/(db|services|trpc\/init|auth|queue)/,
];

const IMPORT_PATTERN =
  /^\s*(?:import|export)\s+([\s\S]*?)from\s*["']([^"']+)["']|^\s*import\s*\(\s*["']([^"']+)["']\s*\)/gm;

function walk(directory: string): string[] {
  const entries = readdirSync(directory);
  return entries.flatMap((entry) => {
    const full = path.join(directory, entry);
    if (entry === "node_modules" || entry === "ui") return [];
    if (statSync(full).isDirectory()) return walk(full);
    return /\.tsx?$/.test(entry) ? [full] : [];
  });
}

function isClientModule(source: string): boolean {
  const head = source.slice(0, 200);
  return /^\s*(?:\/\/[^\n]*\n|\/\*[\s\S]*?\*\/\s*)*["']use client["']/.test(head);
}

function offendingImports(source: string): string[] {
  const found: string[] = [];

  for (const match of source.matchAll(IMPORT_PATTERN)) {
    const clause = match[1] ?? "";
    const specifier = match[2] ?? match[3];
    if (!specifier) continue;

    const typeOnly = /^\s*type\s/.test(clause);
    if (typeOnly) continue;

    const named = clause.match(/\{([\s\S]*)\}/)?.[1];
    const allNamedAreTypes = named
      ?.split(",")
      .map((part) => part.trim())
      .filter(Boolean)
      .every((part) => part.startsWith("type "));
    if (allNamedAreTypes && !/^\s*[A-Za-z_$]/.test(clause)) continue;

    if (RESTRICTED.some((pattern) => pattern.test(specifier))) found.push(specifier);
  }

  return found;
}

describe("client/server boundary", () => {
  it("keeps server-only modules out of every \"use client\" module", () => {
    const leaks: string[] = [];

    for (const directory of SCANNED) {
      for (const file of walk(path.join(root, directory))) {
        const source = readFileSync(file, "utf8");
        if (!isClientModule(source)) continue;

        for (const specifier of offendingImports(source)) {
          leaks.push(`${path.relative(root, file)} imports ${specifier}`);
        }
      }
    }

    expect(leaks, `server-only code would enter the browser bundle:\n${leaks.join("\n")}`).toEqual(
      [],
    );
  });
});

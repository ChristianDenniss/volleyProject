import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
import { inventoryDir, lineOf, parse, rel, repoRoot, stringOf, walk, writeJson } from "./ts-utils";

export interface EndpointEntry {
  method: string;
  path: string;
  module: string;
  controllerMethod: string;
  middleware: string[];
  sourceFile: string;
  sourceLine: number;
}

const METHODS = new Set(["get", "post", "put", "patch", "delete", "options", "head", "all"]);
const modulesDir = path.join(repoRoot, "BE", "src", "modules");

function routeFiles(): string[] {
  const files: string[] = [];
  for (const entry of fs.readdirSync(modulesDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const dir = path.join(modulesDir, entry.name);
    for (const file of fs.readdirSync(dir)) {
      if (file.endsWith(".routes.ts")) files.push(path.join(dir, file));
    }
  }
  return files.sort();
}

function describeHandler(node: ts.Expression): string {
  if (ts.isPropertyAccessExpression(node)) return node.name.getText();
  if (ts.isCallExpression(node)) {
    const callee = node.expression;
    if (ts.isPropertyAccessExpression(callee) && callee.name.getText() === "bind") {
      return describeHandler(callee.expression);
    }
    return `${callee.getText()}(${node.arguments.map((a) => a.getText()).join(", ")})`;
  }
  return node.getText();
}

function joinPath(prefix: string, suffix: string): string {
  if (suffix === "/" || suffix === "") return prefix || "/";
  if (suffix.startsWith("/api")) return suffix;
  return `${prefix.replace(/\/$/, "")}${suffix.startsWith("/") ? suffix : `/${suffix}`}`;
}

export function extractEndpoints(): EndpointEntry[] {
  const endpoints: EndpointEntry[] = [];

  for (const file of routeFiles()) {
    const source = parse(file);
    const moduleName = path.basename(path.dirname(file));
    let prefix = "";
    const local: Array<Omit<EndpointEntry, "path"> & { rawPath: string }> = [];

    walk(source, (node) => {
      if (!ts.isCallExpression(node)) return;
      const callee = node.expression;
      if (!ts.isPropertyAccessExpression(callee)) return;
      const object = callee.expression.getText();
      const method = callee.name.getText();

      if (object === "app" && method === "use") {
        const first = stringOf(node.arguments[0]);
        if (first && node.arguments.length > 1) prefix = first;
        return;
      }

      if (object !== "router" || !METHODS.has(method)) return;
      const rawPath = stringOf(node.arguments[0]);
      if (rawPath === undefined) return;

      const handlers = node.arguments.slice(1).map(describeHandler);
      const controllerMethod = handlers.at(-1) ?? "unknown";
      local.push({
        method: method.toUpperCase(),
        module: moduleName,
        rawPath,
        controllerMethod,
        middleware: handlers.slice(0, -1),
        sourceFile: rel(file),
        sourceLine: lineOf(source, node),
      });
    });

    for (const entry of local) {
      const { rawPath, ...rest } = entry;
      endpoints.push({ ...rest, path: joinPath(prefix, rawPath) });
    }
  }

  return endpoints.sort((a, b) =>
    a.path === b.path ? a.method.localeCompare(b.method) : a.path.localeCompare(b.path),
  );
}

if (import.meta.filename === process.argv[1]) {
  const endpoints = extractEndpoints();
  writeJson(path.join(inventoryDir, "endpoint-inventory.json"), {
    source: rel(modulesDir),
    count: endpoints.length,
    reads: endpoints.filter((e) => e.method === "GET").length,
    writes: endpoints.filter((e) => e.method !== "GET").length,
    endpoints,
  });
}

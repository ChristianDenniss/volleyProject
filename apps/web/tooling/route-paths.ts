import fs from "node:fs";
import path from "node:path";

export const appDir = path.join(import.meta.dirname, "..", "app");

export function routePathFromFile(pageFile: string): string {
  const relative = path.relative(appDir, pageFile).split(path.sep);
  relative.pop();
  const segments = relative
    .filter((segment) => !(segment.startsWith("(") && segment.endsWith(")")))
    .filter((segment) => !segment.startsWith("@"))
    .map((segment) => {
      const dynamic = segment.match(/^\[(?:\.\.\.)?([^\]]+)\]$/);
      return dynamic ? `:${dynamic[1]}` : segment;
    });
  return `/${segments.join("/")}`.replace(/\/+$/, "") || "/";
}

export function findPages(dir: string = appDir): string[] {
  const found: string[] = [];
  const walk = (current: string) => {
    if (!fs.existsSync(current)) return;
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name === "page.tsx") found.push(full);
    }
  };
  walk(dir);
  return found.sort();
}

export function findRouteHandlers(dir: string = appDir): string[] {
  const found: string[] = [];
  const walk = (current: string) => {
    if (!fs.existsSync(current)) return;
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name === "route.ts") found.push(full);
    }
  };
  walk(dir);
  return found.sort();
}

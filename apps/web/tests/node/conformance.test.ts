import { describe, expect, it } from "vitest";
import { routeManifest, routeManifestByPath } from "../../route-manifest";
import { trpcManifest } from "../../trpc-manifest";
import { extractRoutes } from "../../tooling/extract-routes";
import { extractEndpoints } from "../../tooling/extract-endpoints";
import { findPages, routePathFromFile } from "../../tooling/route-paths";

const inventoryRoutes = extractRoutes();
const inventoryEndpoints = extractEndpoints();

describe("T1 completeness", () => {
  it("covers every route declared in FE/src/App.tsx", () => {
    const missing = [
      ...new Set(
        inventoryRoutes
          .map((route) => route.path)
          .filter((path) => !routeManifestByPath.has(path)),
      ),
    ];
    expect(missing, `route-manifest.ts is missing: ${missing.join(", ")}`).toEqual([]);
  });

  it("keeps the extracted role gate for every portal route", () => {
    const gated = inventoryRoutes.filter((route) => route.roles !== null);
    const wrong = gated
      .map((route) => routeManifestByPath.get(route.path))
      .filter((entry) => entry && entry.auth !== "admin")
      .map((entry) => entry!.path);
    expect(wrong, `manifest auth is not "admin" for: ${wrong.join(", ")}`).toEqual([]);
    expect(gated.length).toBeGreaterThan(0);
  });
});

describe("T2 no orphans", () => {
  it("maps every page.tsx back to a manifest entry", () => {
    const orphans = findPages()
      .map((file) => ({ file, path: routePathFromFile(file) }))
      .filter((page) => !routeManifestByPath.has(page.path))
      .map((page) => `${page.path} (${page.file})`);
    expect(orphans, `pages with no manifest entry: ${orphans.join(", ")}`).toEqual([]);
  });

  it("requires a rationale on every new or removed entry", () => {
    const unexplained = routeManifest
      .filter((entry) => entry.origin === "new" || entry.status === "removed")
      .filter((entry) => !entry.rationale)
      .map((entry) => entry.path);
    expect(unexplained, `missing rationale: ${unexplained.join(", ")}`).toEqual([]);
  });

  it("gives every buildable entry a target and every removed entry none", () => {
    const bad = routeManifest
      .filter((entry) =>
        entry.status === "removed" ? entry.target !== null : entry.target === null,
      )
      .map((entry) => entry.path);
    expect(bad).toEqual([]);
  });
});

describe("trpc manifest is bidirectional with the endpoint inventory", () => {
  const writes = inventoryEndpoints
    .filter((endpoint) => endpoint.method !== "GET")
    .map((endpoint) => `${endpoint.method} ${endpoint.path}`);
  const mapped = new Set(trpcManifest.map((entry) => entry.endpoint));

  it("maps every write endpoint", () => {
    const missing = writes.filter((endpoint) => !mapped.has(endpoint));
    expect(missing, `unmapped write endpoints: ${missing.join(", ")}`).toEqual([]);
  });

  it("declares no procedure for an endpoint that does not exist", () => {
    const inventory = new Set(writes);
    const invented = trpcManifest
      .map((entry) => entry.endpoint)
      .filter((endpoint) => !inventory.has(endpoint));
    expect(invented, `manifest entries with no source endpoint: ${invented.join(", ")}`).toEqual([]);
  });

  it("names each procedure exactly once", () => {
    const names = trpcManifest
      .map((entry) => entry.procedure)
      .filter((name): name is string => name !== null);
    expect(names.length).toBe(new Set(names).size);
  });
});

import { describe, expect, it } from "vitest";
import { routeManifest, routeManifestByPath } from "../../route-manifest";
import { trpcManifest } from "../../trpc-manifest";
import { loadEndpointInventory, loadRouteInventory } from "../../tooling/load-inventory";
import { findPages, routePathFromFile } from "../../tooling/route-paths";

const inventoryRoutes = loadRouteInventory();
const inventoryEndpoints = loadEndpointInventory();

describe("T1 completeness", () => {
  it("covers every route in the committed route inventory", () => {
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

  it("requires a rationale on write endpoints that are not in the inventory", () => {
    const inventory = new Set(writes);
    const unexplained = trpcManifest
      .filter((entry) => !inventory.has(entry.endpoint))
      .filter((entry) => !entry.rationale)
      .map((entry) => entry.endpoint);
    expect(
      unexplained,
      `manifest endpoints missing from inventory need a rationale: ${unexplained.join(", ")}`,
    ).toEqual([]);
  });

  it("names each procedure exactly once", () => {
    const names = trpcManifest
      .map((entry) => entry.procedure)
      .filter((name): name is string => name !== null);
    expect(names.length).toBe(new Set(names).size);
  });
});

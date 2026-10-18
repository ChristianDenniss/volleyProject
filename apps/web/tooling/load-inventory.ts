import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { EndpointEntry } from "./extract-endpoints";
import type { RouteEntry } from "./extract-routes";

const inventoryDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "inventory");

export function loadRouteInventory(): RouteEntry[] {
  const raw = JSON.parse(fs.readFileSync(path.join(inventoryDir, "route-inventory.json"), "utf8")) as {
    routes: RouteEntry[];
  };
  return raw.routes;
}

export function loadEndpointInventory(): EndpointEntry[] {
  const raw = JSON.parse(
    fs.readFileSync(path.join(inventoryDir, "endpoint-inventory.json"), "utf8"),
  ) as {
    endpoints: EndpointEntry[];
  };
  return raw.endpoints;
}

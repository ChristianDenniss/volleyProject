import path from "node:path";
import ts from "typescript";
import {
  importMap,
  inventoryDir,
  jsxAttribute,
  jsxTagName,
  lineOf,
  parse,
  rel,
  repoRoot,
  stringOf,
  writeJson,
} from "./ts-utils";

export interface RouteEntry {
  path: string;
  component: string;
  componentFile: string | null;
  sourceLine: number;
  parentPath: string | null;
  roles: string[] | null;
}

const appTsx = path.join(repoRoot, "FE", "src", "App.tsx");

function elementComponent(
  attribute: ts.JsxAttribute | undefined,
): { name: string; roles: string[] | null } | null {
  if (!attribute?.initializer || !ts.isJsxExpression(attribute.initializer)) return null;
  const expression = attribute.initializer.expression;
  if (!expression) return null;

  let roles: string[] | null = null;
  let found: string | null = null;

  const visit = (node: ts.Node): void => {
    const tag = jsxTagName(node);
    if (tag) {
      const opening = ts.isJsxElement(node) ? node.openingElement : node;
      if (tag === "PrivateRoute" && ts.isJsxOpeningLikeElement(opening)) {
        const rolesAttribute = jsxAttribute(opening, "roles");
        if (
          rolesAttribute?.initializer &&
          ts.isJsxExpression(rolesAttribute.initializer) &&
          rolesAttribute.initializer.expression &&
          ts.isArrayLiteralExpression(rolesAttribute.initializer.expression)
        ) {
          roles = rolesAttribute.initializer.expression.elements
            .map((element) => stringOf(element))
            .filter((value): value is string => typeof value === "string");
        }
      } else if (!found) {
        found = tag;
      }
    }
    node.forEachChild(visit);
  };

  visit(expression);
  return found ? { name: found, roles } : null;
}

function joinPath(parent: string | null, child: string): string {
  if (!parent) return child.startsWith("/") ? child : `/${child}`;
  if (child === "") return parent;
  return `${parent.replace(/\/$/, "")}/${child.replace(/^\//, "")}`;
}

export function extractRoutes(): RouteEntry[] {
  const source = parse(appTsx);
  const imports = importMap(source, appTsx);
  const routes: RouteEntry[] = [];

  const visitRoute = (node: ts.Node, parentPath: string | null, parentRoles: string[] | null) => {
    const tag = jsxTagName(node);
    const isRoute = tag === "Route";
    const opening = ts.isJsxElement(node) ? node.openingElement : node;

    if (isRoute && ts.isJsxOpeningLikeElement(opening)) {
      const pathAttribute = jsxAttribute(opening, "path");
      const isIndex = jsxAttribute(opening, "index") !== undefined;
      const rawPath = stringOf(pathAttribute?.initializer);
      const resolved = isIndex
        ? (parentPath ?? "/")
        : joinPath(parentPath, rawPath ?? "");
      const element = elementComponent(jsxAttribute(opening, "element"));
      const roles = element?.roles ?? parentRoles;
      const componentFile = element ? (imports.get(element.name) ?? null) : null;

      routes.push({
        path: resolved,
        component: element?.name ?? "unknown",
        componentFile: componentFile ? rel(componentFile) : null,
        sourceLine: lineOf(source, opening),
        parentPath,
        roles,
      });

      if (ts.isJsxElement(node)) {
        for (const child of node.children) visitRoute(child, resolved, roles);
      }
      return;
    }

    node.forEachChild((child) => visitRoute(child, parentPath, parentRoles));
  };

  visitRoute(source, null, null);
  return routes;
}

if (import.meta.filename === process.argv[1]) {
  const routes = extractRoutes();
  writeJson(path.join(inventoryDir, "route-inventory.json"), {
    source: rel(appTsx),
    count: routes.length,
    routes,
  });
}

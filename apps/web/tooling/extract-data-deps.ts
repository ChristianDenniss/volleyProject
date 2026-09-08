import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
import {
  importMap,
  inventoryDir,
  lineOf,
  parse,
  rel,
  repoRoot,
  walk,
  writeJson,
} from "./ts-utils";
import { extractRoutes } from "./extract-routes";
import { extractEndpoints, type EndpointEntry } from "./extract-endpoints";

interface RawCall {
  callee: string;
  rawArgument: string | null;
  method: string | null;
}

interface RawHook {
  name: string;
  candidates: RawCall[];
  sourceFile: string;
  sourceLine: number;
}

interface ResolvedCall {
  endpoint: string;
  method: string;
}

interface HookDefinition {
  name: string;
  calls: ResolvedCall[];
  sourceFile: string;
  sourceLine: number;
}

interface DataCall {
  hook: string;
  method: string;
  endpoint: string;
  matchedEndpoint: string | null;
  calledIn: string;
  sourceLine: number;
}

interface RouteDataDeps {
  path: string;
  component: string;
  componentFile: string | null;
  filesWalked: string[];
  calls: DataCall[];
  endpoints: string[];
  dataDriven: boolean;
}

const feSrc = path.join(repoRoot, "FE", "src");
const hooksDir = path.join(feSrc, "hooks");

const FETCH_PRIMITIVES = new Set(["useFetch", "useObjectFetch", "authFetch", "fetch"]);

const REACT_BUILTINS = new Set([
  "useState",
  "useEffect",
  "useLayoutEffect",
  "useMemo",
  "useCallback",
  "useRef",
  "useContext",
  "useReducer",
  "useTransition",
  "useDeferredValue",
  "useId",
  "useSyncExternalStore",
  "useImperativeHandle",
  "useDebugValue",
  "useAuth",
  "useNavigate",
  "useParams",
  "useLocation",
  "useSearchParams",
]);

function bareName(node: ts.Expression): string {
  return node.getText().replace(/<[\s\S]*>$/, "").trim();
}

function argumentTemplate(
  node: ts.Node | undefined,
  locals?: Map<string, string>,
): string | null {
  if (!node) return null;
  if (ts.isStringLiteralLike(node) && !ts.isTemplateExpression(node)) return node.text;
  if (ts.isTemplateExpression(node)) {
    let out = node.head.text;
    for (const span of node.templateSpans) out += `\${}${span.literal.text}`;
    return out;
  }
  if (ts.isIdentifier(node) && locals) return locals.get(node.text) ?? null;
  return null;
}

function localTemplates(source: ts.SourceFile): Map<string, string> {
  const locals = new Map<string, string>();
  walk(source, (node) => {
    if (!ts.isVariableDeclaration(node) || !node.initializer) return;
    if (!ts.isIdentifier(node.name)) return;
    const template = argumentTemplate(node.initializer);
    if (template !== null && !locals.has(node.name.text)) locals.set(node.name.text, template);
  });
  return locals;
}

function methodOf(node: ts.CallExpression): string | null {
  for (const argument of node.arguments) {
    if (!ts.isObjectLiteralExpression(argument)) continue;
    for (const property of argument.properties) {
      if (
        ts.isPropertyAssignment(property) &&
        property.name.getText() === "method" &&
        ts.isStringLiteralLike(property.initializer)
      ) {
        return property.initializer.text.toUpperCase();
      }
    }
  }
  return null;
}

function normalizeEndpoint(template: string): string {
  let out = template.trim();
  out = out.replace(/^\$\{\}/, "");
  out = out.replace(/^https?:\/\/[^/]+/, "");
  out = out.replace(/\?[\s\S]*$/, "");
  out = out.replace(/\$\{\}/g, ":param");
  if (!out.startsWith("/")) out = `/${out}`;
  if (!out.startsWith("/api")) out = `/api${out}`;
  out = out.replace(/\/+$/, "");
  return out || "/api";
}

function substitute(endpoint: string, argument: string | null): string {
  if (argument === null) return endpoint;
  if (!endpoint.includes(":param")) return endpoint;
  const replacement = normalizeEndpoint(argument).replace(/^\/api\/?/, "");
  return endpoint.replace(":param", replacement || ":param").replace(/\/+/g, "/");
}

function collectRawHooks(): Map<string, RawHook> {
  const raw = new Map<string, RawHook>();

  const record = (
    name: string,
    body: ts.Node,
    file: string,
    locals: Map<string, string>,
    line: number,
  ) => {
    const candidates: RawCall[] = [];
    walk(body, (inner) => {
      if (!ts.isCallExpression(inner)) return;
      const callee = bareName(inner.expression);
      if (callee === name || REACT_BUILTINS.has(callee)) return;
      if (!FETCH_PRIMITIVES.has(callee) && !callee.startsWith("use")) return;
      candidates.push({
        callee,
        rawArgument: argumentTemplate(inner.arguments[0], locals),
        method: methodOf(inner),
      });
    });
    if (candidates.length > 0) {
      raw.set(name, { name, candidates, sourceFile: rel(file), sourceLine: line });
    }
  };

  for (const file of fs.readdirSync(hooksDir).filter((f) => f.endsWith(".ts"))) {
    const absolute = path.join(hooksDir, file);
    const source = parse(absolute);
    const locals = localTemplates(source);

    walk(source, (node) => {
      if (ts.isVariableDeclaration(node) && node.initializer && ts.isIdentifier(node.name)) {
        if (!node.name.text.startsWith("use")) return;
        record(node.name.text, node.initializer, absolute, locals, lineOf(source, node));
      }
      if (ts.isFunctionDeclaration(node) && node.name && node.body) {
        if (!node.name.text.startsWith("use")) return;
        record(node.name.text, node.body, absolute, locals, lineOf(source, node));
      }
    });
  }

  return raw;
}

function resolveHooks(raw: Map<string, RawHook>): Map<string, HookDefinition> {
  const resolved = new Map<string, HookDefinition>();
  const inFlight = new Set<string>();

  const resolve = (name: string): HookDefinition | null => {
    const cached = resolved.get(name);
    if (cached) return cached;
    const entry = raw.get(name);
    if (!entry || inFlight.has(name)) return null;
    inFlight.add(name);

    const calls: ResolvedCall[] = [];

    for (const candidate of entry.candidates) {
      if (FETCH_PRIMITIVES.has(candidate.callee)) {
        if (candidate.rawArgument === null) continue;
        calls.push({
          endpoint: normalizeEndpoint(candidate.rawArgument),
          method: candidate.method ?? "GET",
        });
        continue;
      }
      const delegate = resolve(candidate.callee);
      if (!delegate) continue;
      for (const call of delegate.calls) {
        calls.push({
          endpoint: substitute(call.endpoint, candidate.rawArgument),
          method: candidate.method ?? call.method,
        });
      }
    }

    inFlight.delete(name);
    if (calls.length === 0) return null;

    const definition: HookDefinition = {
      name,
      calls: dedupe(calls),
      sourceFile: entry.sourceFile,
      sourceLine: entry.sourceLine,
    };
    resolved.set(name, definition);
    return definition;
  };

  for (const name of raw.keys()) resolve(name);
  return resolved;
}

function dedupe(calls: ResolvedCall[]): ResolvedCall[] {
  const seen = new Set<string>();
  return calls.filter((call) => {
    const key = `${call.method} ${call.endpoint}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function endpointMatches(
  endpoints: EndpointEntry[],
  candidate: string,
  method: string,
): string | null {
  const candidateSegments = candidate.split("/").filter(Boolean);
  let best: { label: string; literals: number } | null = null;

  for (const endpoint of endpoints) {
    if (endpoint.method !== method) continue;
    const segments = endpoint.path.split("/").filter(Boolean);
    if (segments.length !== candidateSegments.length) continue;

    let literals = 0;
    const ok = segments.every((segment, index) => {
      const other = candidateSegments[index];
      if (segment === other) {
        literals += 1;
        return true;
      }
      return segment.startsWith(":");
    });
    if (!ok) continue;
    if (!best || literals > best.literals) {
      best = { label: `${endpoint.method} ${endpoint.path}`, literals };
    }
  }

  return best?.label ?? null;
}

function isLocalSource(file: string): boolean {
  return file.startsWith(feSrc) && (file.endsWith(".ts") || file.endsWith(".tsx"));
}

export function extractDataDeps(): RouteDataDeps[] {
  const routes = extractRoutes();
  const endpoints = extractEndpoints();
  const hooks = resolveHooks(collectRawHooks());

  return routes.map((route) => {
    const start = route.componentFile ? path.join(repoRoot, route.componentFile) : null;
    const walked: string[] = [];
    const calls: DataCall[] = [];
    const seen = new Set<string>();

    const visitFile = (file: string) => {
      if (seen.has(file) || !fs.existsSync(file) || !isLocalSource(file)) return;
      seen.add(file);
      if (file.startsWith(hooksDir)) return;
      walked.push(rel(file));

      const source = parse(file);
      const imports = importMap(source, file);
      const locals = localTemplates(source);

      walk(source, (node) => {
        if (!ts.isCallExpression(node)) return;
        const callee = bareName(node.expression);
        const definition = hooks.get(callee);
        const argument = argumentTemplate(node.arguments[0], locals);
        const overrideMethod = methodOf(node);
        const resolvedCalls: ResolvedCall[] = [];

        if (definition) {
          for (const call of definition.calls) {
            resolvedCalls.push({
              endpoint: substitute(call.endpoint, argument),
              method: overrideMethod ?? call.method,
            });
          }
        } else if (FETCH_PRIMITIVES.has(callee) && argument !== null) {
          resolvedCalls.push({
            endpoint: normalizeEndpoint(argument),
            method: overrideMethod ?? "GET",
          });
        }

        for (const call of resolvedCalls) {
          calls.push({
            hook: callee,
            method: call.method,
            endpoint: call.endpoint,
            matchedEndpoint: endpointMatches(endpoints, call.endpoint, call.method),
            calledIn: rel(file),
            sourceLine: lineOf(source, node),
          });
        }
      });

      for (const target of new Set(imports.values())) visitFile(target);
    };

    if (start) visitFile(start);

    const uniqueEndpoints = [
      ...new Set(calls.map((call) => call.matchedEndpoint ?? `${call.method} ${call.endpoint}`)),
    ].sort();

    return {
      path: route.path,
      component: route.component,
      componentFile: route.componentFile,
      filesWalked: walked,
      calls,
      endpoints: uniqueEndpoints,
      dataDriven: uniqueEndpoints.length > 0,
    };
  });
}

if (import.meta.filename === process.argv[1]) {
  const deps = extractDataDeps();
  writeJson(path.join(inventoryDir, "route-data-deps.json"), {
    count: deps.length,
    static: deps.filter((d) => !d.dataDriven).map((d) => d.path),
    unresolved: [
      ...new Set(
        deps.flatMap((d) =>
          d.calls.filter((c) => !c.matchedEndpoint).map((c) => `${c.method} ${c.endpoint} (${c.hook})`),
        ),
      ),
    ].sort(),
    routes: deps,
  });
}

export { collectRawHooks, resolveHooks, normalizeEndpoint };
export type { RouteDataDeps, DataCall, HookDefinition, ResolvedCall };

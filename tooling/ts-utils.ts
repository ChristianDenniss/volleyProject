import path from "node:path";
import fs from "node:fs";
import ts from "typescript";

export const repoRoot = path.resolve(import.meta.dirname, "..", "..");

export function rel(absolute: string): string {
  return path.relative(repoRoot, absolute).split(path.sep).join("/");
}

export function parse(absolute: string): ts.SourceFile {
  return ts.createSourceFile(
    absolute,
    fs.readFileSync(absolute, "utf8"),
    ts.ScriptTarget.Latest,
    true,
    absolute.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
}

export function lineOf(source: ts.SourceFile, node: ts.Node): number {
  return source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1;
}

export function stringOf(node: ts.Node | undefined): string | undefined {
  if (!node) return undefined;
  if (ts.isStringLiteralLike(node)) return node.text;
  if (ts.isJsxExpression(node) && node.expression) return stringOf(node.expression);
  if (ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  return undefined;
}

export function jsxAttribute(
  element: ts.JsxSelfClosingElement | ts.JsxOpeningElement,
  name: string,
): ts.JsxAttribute | undefined {
  return element.attributes.properties.find(
    (p): p is ts.JsxAttribute => ts.isJsxAttribute(p) && p.name.getText() === name,
  );
}

export function jsxTagName(node: ts.Node): string | undefined {
  if (ts.isJsxSelfClosingElement(node)) return node.tagName.getText();
  if (ts.isJsxElement(node)) return node.openingElement.tagName.getText();
  return undefined;
}

export function importMap(source: ts.SourceFile, fromFile: string): Map<string, string> {
  const map = new Map<string, string>();
  for (const statement of source.statements) {
    if (!ts.isImportDeclaration(statement)) continue;
    const specifier = stringOf(statement.moduleSpecifier);
    if (!specifier || !specifier.startsWith(".")) continue;
    const resolved = resolveModule(path.dirname(fromFile), specifier);
    const clause = statement.importClause;
    if (!clause) continue;
    if (clause.name) map.set(clause.name.text, resolved);
    if (clause.namedBindings && ts.isNamedImports(clause.namedBindings)) {
      for (const element of clause.namedBindings.elements) {
        map.set(element.name.text, resolved);
      }
    }
  }
  return map;
}

export function resolveModule(dir: string, specifier: string): string {
  const base = path.resolve(dir, specifier.replace(/\.js$/, ""));
  const candidates = [
    base,
    `${base}.tsx`,
    `${base}.ts`,
    path.join(base, "index.tsx"),
    path.join(base, "index.ts"),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate;
  }
  return `${base}.tsx`;
}

export function walk(node: ts.Node, visit: (node: ts.Node) => void): void {
  visit(node);
  node.forEachChild((child) => walk(child, visit));
}

export function writeJson(outFile: string, value: unknown): void {
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, `${JSON.stringify(value, null, 2)}\n`);
  process.stdout.write(`wrote ${rel(outFile)}\n`);
}

export const inventoryDir = path.join(import.meta.dirname, "..", "inventory");

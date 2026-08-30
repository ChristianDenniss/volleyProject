/**
 * check-css-tokens — the CSS half of CLAUDE.md Rule 2, which ESLint can't see.
 *
 * ESLint parses TS/TSX, so `eslint-rules/no-raw-color-classes.js` catches a hex value in a
 * component but not one in a `.css` file. This script scans every stylesheet under `src/`
 * and fails on a raw color outside the two files allowed to contain one:
 *
 *   styles/globals.css — the token definitions themselves
 *   styles/tokens.css  — the legacy alias shim, which only aliases (no raw values)
 *
 * Run via `npm run lint:conventions`.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const SRC = join(ROOT, 'src');

/** The only files allowed to contain a literal color. */
const ALLOWED = new Set(['src/styles/globals.css']);

/** #fff, #ffffff, #ffffffff — but not a `#id` selector or a `#{...}` interpolation. */
const HEX_RE = /#[0-9a-fA-F]{3,8}\b/g;
/** rgb()/rgba()/hsl()/hsla() with literal numbers, i.e. not built from a var(). */
const FUNC_COLOR_RE = /\b(?:rgba?|hsla?)\(\s*[\d.]/g;
/** Named CSS colors that show up in practice. `transparent`, `currentColor` and `inherit` are fine. */
const NAMED_COLOR_RE = /:\s*(white|black|red|blue|green|gray|grey|silver|gold|orange|purple|pink|navy|teal)\s*[;!}]/gi;

function walk(dir) {
  const files = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) files.push(...walk(full));
    else if (entry.endsWith('.css')) files.push(full);
  }
  return files;
}

const violations = [];

for (const file of walk(SRC)) {
  const rel = relative(ROOT, file).replace(/\\/g, '/');
  if (ALLOWED.has(rel)) continue;

  const lines = readFileSync(file, 'utf8').split('\n');
  lines.forEach((line, index) => {
    if (line.trimStart().startsWith('/*') || line.trimStart().startsWith('*')) return;

    for (const re of [HEX_RE, FUNC_COLOR_RE, NAMED_COLOR_RE]) {
      re.lastIndex = 0;
      const match = re.exec(line);
      if (match) {
        violations.push({ file: rel, line: index + 1, text: match[0].trim(), source: line.trim() });
        break;
      }
    }
  });
}

if (violations.length === 0) {
  console.log('check-css-tokens: no raw colors in CSS outside styles/globals.css.');
  process.exit(0);
}

console.error(`check-css-tokens: ${violations.length} raw color value(s) outside styles/globals.css.\n`);
for (const v of violations) {
  console.error(`  ${v.file}:${v.line}  ${v.text}`);
  console.error(`      ${v.source}`);
}
console.error(
  '\nEvery color must come from the token system in src/styles/globals.css (CLAUDE.md Rule 2).',
);
process.exit(1);

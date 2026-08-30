// Enforces CLAUDE.md Rule 2 (color guide): every color must come from the token system in
// src/styles/globals.css. Scans every string literal and template-literal chunk — not just
// literal `className=` attributes — so it also catches conditional class construction
// (`isActive ? 'text-blue-600' : ...`, clsx()/cn()-style helpers, and class maps declared at
// module scope). Also flags raw hex and legacy `var(--…)` token names inside style objects.

const COLOR_FAMILIES = [
  'red', 'orange', 'amber', 'yellow', 'lime', 'green', 'emerald', 'teal', 'cyan', 'sky',
  'blue', 'indigo', 'violet', 'purple', 'fuchsia', 'pink', 'rose',
  'slate', 'gray', 'zinc', 'neutral', 'stone',
];

const PREFIXES = [
  'bg', 'text', 'border', 'from', 'to', 'via', 'ring', 'fill', 'stroke', 'divide',
  'outline', 'decoration', 'placeholder', 'caret', 'accent', 'shadow',
];

// bg-blue-600, text-slate-400, border-red-200 — a raw palette stop with no semantic meaning.
const PALETTE_CLASS_RE = new RegExp(
  `^(?:${PREFIXES.join('|')})-(?:${COLOR_FAMILIES.join('|')})-\\d{2,3}$`,
);

// text-white / bg-black — the two that bypass the theme most often.
const WHITE_BLACK_CLASS_RE = new RegExp(`^(?:${PREFIXES.join('|')})-(?:white|black)$`);

const HEX_RE = /#[0-9a-fA-F]{3,8}\b/;

// The legacy token names from the pre-Tailwind tokens.css shim. They still resolve while the
// shim exists, which makes them an easy thing to reach for by accident — but new code must use
// the globals.css names so the shim can actually be deleted.
const LEGACY_VAR_RE =
  /var\(\s*--(?:primary-blue|primary-dark|navy|pale-blue|border-blue|hover-blue|bg-light|text-dark|border-color|color-brand-primary|color-bg|color-text|color-accent)(?:-[a-z-]+)?\s*\)/;

const COLOR_STYLE_KEYS = new Set([
  'color', 'background', 'backgroundColor', 'borderColor', 'border',
  'fill', 'stroke', 'boxShadow', 'filter', 'outlineColor', 'textDecorationColor',
]);

function checkClassString(str, node, context) {
  if (typeof str !== 'string') return;
  for (const token of str.split(/\s+/)) {
    // Strip Tailwind variant prefixes (hover:, md:, dark:, group-hover:) and any opacity
    // modifier, so `hover:bg-blue-600/50` is still recognised as the palette class it is.
    const bare = token.split(':').pop().split('/')[0];
    if (PALETTE_CLASS_RE.test(bare) || WHITE_BLACK_CLASS_RE.test(bare)) {
      context.report({
        node,
        message: `"${bare}" is a raw Tailwind palette class — use a token class from styles/globals.css instead (see CLAUDE.md Rule 2).`,
      });
    }
  }
}

export default {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow raw Tailwind palette classes, raw hex colors and legacy token names — use styles/globals.css tokens.',
    },
    schema: [],
  },
  create(context) {
    return {
      Literal(node) {
        if (typeof node.value === 'string') checkClassString(node.value, node, context);
      },

      TemplateElement(node) {
        checkClassString(node.value.raw, node, context);
      },

      Property(node) {
        const keyName =
          node.key.type === 'Identifier'
            ? node.key.name
            : node.key.type === 'Literal'
              ? String(node.key.value)
              : null;
        if (!keyName || !COLOR_STYLE_KEYS.has(keyName)) return;
        if (node.value.type !== 'Literal' || typeof node.value.value !== 'string') return;

        const value = node.value.value;
        if (HEX_RE.test(value)) {
          context.report({
            node: node.value,
            message: `Raw hex color "${value}" — use a globals.css token (var(--color-*)) instead.`,
          });
        } else if (LEGACY_VAR_RE.test(value)) {
          context.report({
            node: node.value,
            message: `"${value}" is a legacy token name from the tokens.css shim — use the globals.css name (e.g. var(--color-surface), var(--color-content), var(--color-brand)).`,
          });
        }
      },
    };
  },
};

// Enforces CLAUDE.md Rule 5 (no inline styling): a `style={{ … }}` prop is only allowed for
// values that genuinely cannot be a class — a computed dimension, a transform, a CSS custom
// property, or one of the documented token escapes (`var(--color-overlay)`, `var(--shadow-*)`).
//
// Everything else — colors, spacing, font sizes, display, flex — has a Tailwind token utility,
// and putting it inline means it bypasses the design system and can't respond to a theme.

// Properties that must never appear in an inline style object: every one of them has a
// first-class token utility.
const FORBIDDEN_PROPERTIES = new Set([
  'color', 'backgroundColor', 'borderColor',
  'fontSize', 'fontWeight', 'fontFamily',
  'padding', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
  'margin', 'marginTop', 'marginRight', 'marginBottom', 'marginLeft',
  'display', 'flexDirection', 'alignItems', 'justifyContent', 'gap',
  'borderRadius', 'textAlign', 'textTransform',
]);

// Allowed even though they name a color: these are the documented escapes for values Tailwind
// has no utility for. They must reference a token, which no-raw-color-classes verifies.
const TOKEN_ESCAPE_RE = /^var\(--(?:color-overlay|shadow-|chart-|brand-|surface-|status-)/;

export default {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow inline style properties that have a Tailwind token utility — use the class instead.',
    },
    schema: [],
  },
  create(context) {
    return {
      JSXAttribute(node) {
        if (node.name.name !== 'style') return;
        if (!node.value || node.value.type !== 'JSXExpressionContainer') return;

        const expression = node.value.expression;
        if (expression.type !== 'ObjectExpression') return;

        for (const property of expression.properties) {
          if (property.type !== 'Property') continue;

          const keyName =
            property.key.type === 'Identifier'
              ? property.key.name
              : property.key.type === 'Literal'
                ? String(property.key.value)
                : null;
          if (!keyName || !FORBIDDEN_PROPERTIES.has(keyName)) continue;

          // A documented token escape is fine — `style={{ background: 'var(--color-overlay)' }}`.
          const value = property.value;
          if (
            value.type === 'Literal' &&
            typeof value.value === 'string' &&
            TOKEN_ESCAPE_RE.test(value.value)
          ) {
            continue;
          }

          context.report({
            node: property,
            message: `Inline style "${keyName}" — use the equivalent Tailwind token utility instead (see CLAUDE.md Rule 5). Inline styles bypass the design system and can't respond to a theme.`,
          });
        }
      },
    };
  },
};

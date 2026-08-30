// CLAUDE.md hard-rule conventions — run across the WHOLE repo via `npm run lint:conventions`.
// See eslint.config.js for the standard TypeScript/React rules.
//
// These are structural (string/AST-shape) checks, so this run parses syntax only — no
// parserOptions.project, and none of the cost of full type information.
import tseslint from 'typescript-eslint';
import noRawColorClasses from './eslint-rules/no-raw-color-classes.js';
import noInlineStyleColors from './eslint-rules/no-inline-style-colors.js';
import apiCallsInHooks from './eslint-rules/api-calls-in-hooks.js';

// Files intentionally exempt from the color-token rule — fixed brand-mark or third-party
// palette colors that must render the same regardless of theme, not a case of "forgot to use
// a token". See CLAUDE.md "Documented exceptions". Add to this list only with a stated reason.
const COLOR_RULE_EXEMPT = [
  // Reads the --chart-* / --color-* custom properties back out of the DOM so chart.js and
  // three.js (which can't consume a CSS class) get literal strings. The hex values here are
  // pre-paint fallbacks for the tokens they mirror, not an independent palette.
  'src/constants/chartPalette.ts',
];

// The inline-style rule is about styling; a few places legitimately compute a layout value at
// runtime and have nowhere else to put it.
const INLINE_STYLE_EXEMPT = [
  // Positions a portalled popover against a measured viewport rect — the coordinates only
  // exist at runtime, so there is no class that could express them.
  'src/components/ui/misc/OverflowListCell.tsx',
  // Same, for the column-picker panel.
  'src/components/ui/filters/ColumnToggleMenu.tsx',
  // Applies the positional team-accent rotation (`teamAccentVar(index)`), which resolves to a
  // `var(--team-accent-N)` token chosen at runtime. The value IS a token — the rule just can't
  // see that statically, because the expression is a function call rather than a literal.
  'src/components/Single/SingleSeason.tsx',
  // Paints each archetype's identity swatch with `archetype.color`, which resolves from an
  // `--archetype-*` token at runtime (see analytics/playerArchetypes). The value IS a token;
  // the rule only sees a member expression.
  'src/components/VectorGraphPage.tsx',
];

export default [
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'public/mockServiceWorker.js',
      'netlify/**',
      'scripts/**',
      // Standalone Node maintenance scripts at the repo root — not app source, and not
      // parseable as an ES module by this run's syntax-only parser.
      'clear-cache.js',
    ],
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    // This run only knows about its own rules, so an inline `eslint-disable` comment written
    // for eslint.config.js's rules would otherwise error here as "rule not found".
    linterOptions: { noInlineConfig: true },
    // The plugin is registered once — ESLint's flat config rejects redefining a plugin name,
    // so the per-rule blocks below carry only `rules` + their own `ignores`.
    plugins: {
      local: {
        rules: {
          'no-raw-color-classes': noRawColorClasses,
          'no-inline-style-colors': noInlineStyleColors,
          'api-calls-in-hooks': apiCallsInHooks,
        },
      },
    },
  },

  /* Rule 2 — every color comes from the globals.css token system. */
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: COLOR_RULE_EXEMPT,
    rules: { 'local/no-raw-color-classes': 'error' },
  },

  /* Rule 5 — no inline styling for anything that has a token utility. */
  {
    files: ['src/**/*.tsx'],
    ignores: INLINE_STYLE_EXEMPT,
    rules: { 'local/no-inline-style-colors': 'error' },
  },

  /* Rule 3 — API calls live in src/hooks/ only. */
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/hooks/**', 'src/mocks/**', 'src/utils/fetchAvatarRoblox.ts', 'src/main.tsx'],
    rules: { 'local/api-calls-in-hooks': 'error' },
  },
];

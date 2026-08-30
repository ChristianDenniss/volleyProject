// Enforces CLAUDE.md Rule 3 (API calls belong in hooks only). Flags a component that imports
// `axios` or calls the `fetch` global directly, instead of going through a hook in `src/hooks/`.
//
// The built-in `no-restricted-imports` covers the axios half, but not `fetch` in a way that is
// scope-aware — this rule ignores a locally-declared `const fetch = …` and a member call like
// `client.fetch()`, so only the real global is reported.

export default {
  meta: {
    type: 'problem',
    docs: { description: 'Disallow direct fetch/axios calls outside src/hooks/.' },
    schema: [],
  },
  create(context) {
    const message =
      'API calls belong in src/hooks/<resource> only — write or reuse a hook instead of fetching here (CLAUDE.md Rule 3).';

    return {
      ImportDeclaration(node) {
        if (node.source.value === 'axios') {
          context.report({ node, message });
        }
      },

      CallExpression(node) {
        if (node.callee.type !== 'Identifier' || node.callee.name !== 'fetch') return;

        // Walk up the scope chain — a local binding named `fetch` is not the global.
        let scope = context.sourceCode.getScope(node);
        while (scope) {
          if (scope.variables.some((variable) => variable.name === 'fetch')) return;
          scope = scope.upper;
        }

        context.report({ node, message });
      },
    };
  },
};

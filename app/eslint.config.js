import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";

const RESTRICTED = [/^@db(\/|$)/, /^@server(\/|$)/, /(^|\/)server\/(db|services|trpc\/init|auth|queue)/];

const clientBoundary = {
  rules: {
    "no-server-imports": {
      meta: {
        type: "problem",
        schema: [],
        messages: {
          leak: 'a "use client" module may not import {{name}} — server-only code would enter the browser bundle',
        },
      },
      create(context) {
        const source = context.sourceCode ?? context.getSourceCode();
        const isClient = source.ast.body.some(
          (node) =>
            node.type === "ExpressionStatement" &&
            node.expression.type === "Literal" &&
            node.expression.value === "use client",
        );
        if (!isClient) return {};
        const check = (node, name) => {
          if (typeof name === "string" && RESTRICTED.some((re) => re.test(name))) {
            context.report({ node, messageId: "leak", data: { name } });
          }
        };
        return {
          ImportDeclaration: (node) => check(node, node.source.value),
          ExportNamedDeclaration: (node) => node.source && check(node, node.source.value),
          ExportAllDeclaration: (node) => node.source && check(node, node.source.value),
          ImportExpression: (node) =>
            node.source.type === "Literal" && check(node, node.source.value),
        };
      },
    },
  },
};

export default tseslint.config(
  {
    ignores: [
      "dist/**",
      ".next/**",
      ".vinext/**",
      ".wrangler/**",
      "drizzle/**",
      "node_modules/**",
      "components/ui/**",
      "worker-configuration.d.ts",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.ts", "**/*.tsx"],
    plugins: { "react-hooks": reactHooks, boundary: clientBoundary },
    rules: {
      "boundary/no-server-imports": "error",
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
  {
    files: ["tooling/**/*.ts", "tests/**/*.ts"],
    rules: { "@typescript-eslint/no-explicit-any": "off" },
  },
);

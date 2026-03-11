import tsEslintPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import eslintConfigPrettier from "eslint-config-prettier";
import sveltePlugin from "eslint-plugin-svelte";

const unusedVariablesRule = [
  "error",
  {
    args: "all",
    argsIgnorePattern: "^_",
    caughtErrors: "all",
    caughtErrorsIgnorePattern: "^_",
    destructuredArrayIgnorePattern: "^_",
    varsIgnorePattern: "^_",
  },
];

export default [
  {
    ignores: [
      ".svelte-kit/**",
      ".vercel/**",
      "build/**",
      "coverage/**",
      "dist/**",
      "node_modules/**",
      "src/lib/generated/**",
      "convex/_generated/**",
    ],
  },
  ...sveltePlugin.configs["flat/recommended"],
  {
    files: ["**/*.{js,mjs,cjs,ts}"],
    plugins: {
      "@typescript-eslint": tsEslintPlugin,
    },
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
    },
    rules: {
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": unusedVariablesRule,
    },
  },
  {
    files: ["**/*.{ts,d.ts}"],
    languageOptions: {
      parser: tsParser,
    },
  },
  {
    files: ["**/*.svelte"],
    languageOptions: {
      parserOptions: {
        parser: tsParser,
      },
    },
    rules: {
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
  eslintConfigPrettier,
];

import tsEslintPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import eslintConfigPrettier from "eslint-config-prettier";
import simpleImportSortPlugin from "eslint-plugin-simple-import-sort";
import sveltePlugin from "eslint-plugin-svelte";
import unusedImportsPlugin from "eslint-plugin-unused-imports";

import svelteUnusedImportsPlugin from "./eslint/svelteUnusedImportsPlugin.js";

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
    files: ["**/*.{js,mjs,cjs,ts}", "**/*.d.ts"],
    plugins: {
      "@typescript-eslint": tsEslintPlugin,
      "simple-import-sort": simpleImportSortPlugin,
      "unused-imports": unusedImportsPlugin,
    },
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
    },
    rules: {
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "Program > :not(ImportDeclaration):not(ExpressionStatement[directive=true]) ~ ImportDeclaration",
          message:
            "Move all imports into a single block at the top of the file.",
        },
      ],
      "simple-import-sort/imports": "error",
      "simple-import-sort/exports": "error",
      "unused-imports/no-unused-imports": "error",
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
    plugins: {
      "simple-import-sort": simpleImportSortPlugin,
      "svelte-unused-imports": svelteUnusedImportsPlugin,
    },
    languageOptions: {
      parserOptions: {
        parser: tsParser,
      },
    },
    rules: {
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "Program > :not(ImportDeclaration):not(ExpressionStatement[directive=true]) ~ ImportDeclaration",
          message:
            "Move all imports into a single block at the top of the file.",
        },
      ],
      "simple-import-sort/imports": "error",
      "simple-import-sort/exports": "error",
      "svelte-unused-imports/no-unused-imports": "error",
    },
  },
  eslintConfigPrettier,
];

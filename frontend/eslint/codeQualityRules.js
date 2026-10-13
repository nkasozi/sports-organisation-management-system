import code_quality_plugin from "./codeQualityPlugin.js";

const IMPORT_PLACEMENT_SELECTOR = {
  selector:
    "Program > :not(ImportDeclaration):not(ExpressionStatement[directive=true]) ~ ImportDeclaration",
  message: "Move all imports into a single block at the top of the file.",
};

const PRODUCTION_SYNTAX_RULES = [
  IMPORT_PLACEMENT_SELECTOR,
  {
    selector: "ThrowStatement",
    message: "R4: return a failure Result instead of throwing.",
  },
  {
    selector: "IfStatement > BlockStatement.consequent IfStatement",
    message: "R5: no nested if; use flat guard clauses.",
  },
  {
    selector: "IfStatement > IfStatement.alternate",
    message: "R7: use a switch (or a lookup) instead of an if/else-if chain.",
  },
  {
    selector:
      "BinaryExpression[operator=/^[!=]==?$/] > Literal[raw=/^[\"'].+[\"']$/]",
    message:
      "R30: compare against an enum member or named constant, not a string literal.",
  },
  {
    selector: "SwitchCase > Literal[raw=/^[\"']/].test",
    message:
      "R30: switch on enum members or named constants, not string literals.",
  },
  {
    selector:
      "CallExpression[callee.object.name='console'] > TemplateLiteral.arguments",
    message:
      "R16: use a fixed message plus a structured payload, not an interpolated string.",
  },
  {
    selector:
      "CallExpression[callee.object.name='console']:not(:has(Property[key.name='event']))",
    message: "R16: every log needs a structured payload with an `event` field.",
  },
];

const TEST_SYNTAX_RULES = [
  IMPORT_PLACEMENT_SELECTOR,
  {
    selector: "ThrowStatement",
    message:
      "R4: use expect.unreachable or Result assertions instead of throwing.",
  },
];

export const code_quality_shared_config = [
  {
    files: ["**/*.ts", "**/*.svelte"],
    plugins: { "code-quality": code_quality_plugin },
    rules: {
      "code-quality/no-code-comments": "error",
      "code-quality/no-stale-spread-across-await": "error",
      "no-restricted-syntax": ["error", ...PRODUCTION_SYNTAX_RULES],
      "max-lines": ["error", { max: 200 }],
      "max-lines-per-function": [
        "error",
        { max: 40, skipBlankLines: true, skipComments: true },
      ],
      "no-else-return": ["error", { allowElseIf: false }],
    },
  },
  {
    files: ["**/*.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-non-null-assertion": "error",
      "@typescript-eslint/explicit-function-return-type": [
        "error",
        { allowExpressions: true, allowTypedFunctionExpressions: true },
      ],
    },
  },
  {
    files: [
      "**/*.test.ts",
      "**/*.test_support.ts",
      "**/*.contract.test.ts",
      "**/*.fixture.ts",
    ],
    rules: {
      "max-lines-per-function": "off",
      "no-restricted-syntax": ["error", ...TEST_SYNTAX_RULES],
    },
  },
];

export const code_quality_typed_config = [
  {
    files: ["src/**/*.ts", "convex/**/*.ts"],
    ignores: ["src/lib/tooling/fixtures/**", "convex/_generated/**"],
    languageOptions: {
      parserOptions: { projectService: true },
    },
    rules: {
      "code-quality/no-ignored-result": "error",
      "@typescript-eslint/switch-exhaustiveness-check": [
        "error",
        {
          considerDefaultExhaustiveForUnions: false,
          requireDefaultForNonUnion: true,
        },
      ],
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-misused-promises": "error",
    },
  },
];

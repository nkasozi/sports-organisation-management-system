import { fileURLToPath } from "node:url";

import tsParser from "@typescript-eslint/parser";
import { ESLint, Linter } from "eslint";
import { describe, expect, it } from "vitest";

import code_quality_plugin from "../../../eslint/codeQualityPlugin.js";

const FRONTEND_ROOT = fileURLToPath(new URL("../../../", import.meta.url));
const IGNORED_RESULT_FIXTURE =
  "src/lib/tooling/fixtures/ignoredResultCases.fixture.ts";
const NO_CODE_COMMENTS_RULE = "code-quality/no-code-comments";
const NO_IGNORED_RESULT_RULE = "code-quality/no-ignored-result";
const NO_STALE_SPREAD_RULE = "code-quality/no-stale-spread-across-await";

function lint_for_comments(source: string): string[] {
  const linter = new Linter({ configType: "flat" });
  return linter
    .verify(
      source,
      [
        {
          files: ["**/*.ts"],
          languageOptions: { parser: tsParser },
          plugins: { "code-quality": code_quality_plugin },
          rules: { [NO_CODE_COMMENTS_RULE]: "error" },
        },
      ],
      "example.ts",
    )
    .filter(
      (message: Linter.LintMessage) => message.ruleId === NO_CODE_COMMENTS_RULE,
    )
    .map((message: Linter.LintMessage) => message.message);
}

function lint_for_stale_spread(source: string): string[] {
  const linter = new Linter({ configType: "flat" });
  return linter
    .verify(
      source,
      [
        {
          files: ["**/*.ts"],
          languageOptions: { parser: tsParser },
          plugins: { "code-quality": code_quality_plugin },
          rules: { [NO_STALE_SPREAD_RULE]: "error" },
        },
      ],
      "example.ts",
    )
    .filter(
      (message: Linter.LintMessage) => message.ruleId === NO_STALE_SPREAD_RULE,
    )
    .map((message: Linter.LintMessage) => message.message);
}

async function lint_ignored_result_fixture(): Promise<number[]> {
  const eslint = new ESLint({
    cwd: FRONTEND_ROOT,
    overrideConfigFile: true,
    overrideConfig: [
      {
        files: ["**/*.ts"],
        languageOptions: {
          parser: tsParser,
          parserOptions: {
            projectService: true,
            tsconfigRootDir: FRONTEND_ROOT,
          },
        },
        plugins: { "code-quality": code_quality_plugin },
        rules: { [NO_IGNORED_RESULT_RULE]: "error" },
      },
    ],
  });
  const [lint_result] = await eslint.lintFiles([IGNORED_RESULT_FIXTURE]);
  return lint_result.messages
    .filter(
      (message: Linter.LintMessage) =>
        message.ruleId === NO_IGNORED_RESULT_RULE,
    )
    .map((message: Linter.LintMessage) => message.line);
}

describe("code-quality/no-code-comments", () => {
  it("reports line and block comments", () => {
    expect(
      lint_for_comments("const a = 1; // note\n/* block */\nconst b = 2;"),
    ).toHaveLength(2);
  });

  it("allows lint, type-checker and formatter directives", () => {
    const source = [
      "// eslint-disable-next-line no-console",
      "/* eslint-disable */",
      "// @ts-expect-error intentional",
      "// prettier-ignore",
      "const a = 1;",
    ].join("\n");

    expect(lint_for_comments(source)).toEqual([]);
  });
});

describe("code-quality/no-ignored-result", () => {
  it("reports Result and AsyncResult values that are discarded without checking success", async () => {
    expect(await lint_ignored_result_fixture()).toEqual([20, 21, 22]);
  }, 60000);
});

describe("code-quality/no-stale-spread-across-await", () => {
  it("reports spreading a variable into its own reassignment before an await", () => {
    const source = [
      "let state = { loading: true };",
      "async function load(): Promise<void> {",
      "  state = { ...state, ...(await fetch_flags()) };",
      "}",
    ].join("\n");

    expect(lint_for_stale_spread(source)).toHaveLength(1);
  });

  it("allows awaiting first and spreading the current value afterwards", () => {
    const source = [
      "let state = { loading: true };",
      "async function load(): Promise<void> {",
      "  const flags = await fetch_flags();",
      "  state = { ...state, ...flags };",
      "}",
    ].join("\n");

    expect(lint_for_stale_spread(source)).toEqual([]);
  });

  it("allows awaits that come before the spread in the same object", () => {
    const source = [
      "let state = { loading: true };",
      "async function load(): Promise<void> {",
      "  state = { flags: await fetch_flags(), ...other };",
      "}",
    ].join("\n");

    expect(lint_for_stale_spread(source)).toEqual([]);
  });
});

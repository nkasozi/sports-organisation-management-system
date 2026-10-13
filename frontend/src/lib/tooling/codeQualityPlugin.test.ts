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

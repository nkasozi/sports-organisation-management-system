import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  collect_no_null_guard_file_paths,
  find_null_guard_violations,
} from "../../../scripts/noNullGuard.js";

describe("noNullGuard", () => {
  it("detects nullable fields and nullish function returns", () => {
    const violations = find_null_guard_violations(
      "src/example.ts",
      [
        "type Example = { value: string | null };",
        "interface ExampleConfig {",
        "  callback: (() => void) | undefined;",
        "}",
        "class ExampleModel {",
        "  current_value: string | undefined = void 0;",
        "}",
        "function load_value(): Example | null {",
        "  return null;",
        "}",
        "const read_value = (): string | undefined => undefined;",
      ].join("\n"),
    );

    expect(violations).toEqual([
      expect.objectContaining({
        line_number: 1,
        rule_id: "nullable_field",
      }),
      expect.objectContaining({
        line_number: 3,
        rule_id: "nullable_field",
      }),
      expect.objectContaining({
        line_number: 6,
        rule_id: "nullable_field",
      }),
      expect.objectContaining({
        line_number: 8,
        rule_id: "nullish_return_type",
      }),
      expect.objectContaining({
        line_number: 9,
        rule_id: "nullish_return_value",
      }),
      expect.objectContaining({
        line_number: 11,
        rule_id: "nullish_return_type",
      }),
      expect.objectContaining({
        line_number: 11,
        rule_id: "nullish_return_value",
      }),
    ]);
  });

  it("ignores runtime nullish checks, strings, comments, and local annotations", () => {
    const violations = find_null_guard_violations(
      "src/example.ts",
      [
        'const label = "return null";',
        "const detail = 'value | null';",
        "const message = `mockResolvedValue(null)`;",
        "// return null",
        "/* value | undefined */",
        'const is_browser = typeof window !== "undefined";',
        "const pending_value = value === undefined ? fallback : value;",
        "const current_value = value === null ? fallback : value;",
        "const cached_value: string | undefined = cache.get(key);",
        "function get_value(): string {",
        "  return cache as string | undefined;",
        "}",
      ].join("\n"),
    );

    expect(violations).toEqual([]);
  });

  it("scans repo code files instead of a hardcoded allow list", () => {
    const repo_root_path = fileURLToPath(
      new URL("../../../../", import.meta.url),
    );
    const discovered_file_paths =
      collect_no_null_guard_file_paths(repo_root_path);

    expect(discovered_file_paths).toContain(
      "frontend/src/lib/adapters/iam/clerkAuthService.ts",
    );
    expect(discovered_file_paths).toContain(
      "frontend/src/lib/tooling/policyEnforcement.test.ts",
    );
    expect(discovered_file_paths).toContain("frontend/scripts/noNullGuard.js");
    expect(discovered_file_paths).not.toContain(
      "frontend/convex/_generated/api.js",
    );
  });
});

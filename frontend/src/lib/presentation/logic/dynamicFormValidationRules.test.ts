import { describe, expect, it, vi } from "vitest";

import {
  validate_field_against_rules,
  validate_form_data_against_metadata,
} from "./dynamicFormValidation";

vi.mock("./dynamicFormLogic", () => ({
  is_field_visible_by_visible_when_condition: vi.fn(() => true),
}));

vi.mock("./systemUserFormLogic", () => ({
  build_user_role_state: vi.fn(() => ({ status: "missing" })),
  should_field_be_required_for_role: vi.fn(() => false),
}));

function rule(rule_type: string, rule_value: unknown, message: string): never {
  return { rule_type, rule_value, error_message: message } as never;
}

function validate(
  data: Record<string, unknown>,
  fields: Record<string, unknown>[],
  is_edit_mode: boolean,
): unknown {
  return validate_form_data_against_metadata(
    data,
    { fields } as never,
    is_edit_mode,
    "player",
  );
}

describe("validate_field_against_rules characterization", () => {
  it.each([
    ["min_length pass", "abc", rule("min_length", 3, "m"), true],
    ["max_length fail", "abcdef", rule("max_length", 5, "m"), false],
    ["max_length pass", "abcde", rule("max_length", 5, "m"), true],
    ["min_value fail", 1, rule("min_value", 2, "m"), false],
    ["min_value pass", 2, rule("min_value", 2, "m"), true],
    ["max_value pass", 10, rule("max_value", 10, "m"), true],
    ["pattern fail", "a1", rule("pattern", "^[A-Z]", "m"), false],
    ["string vs min_value ignored", "1", rule("min_value", 5, "m"), true],
    ["number vs min_length ignored", 1, rule("min_length", 5, "m"), true],
    ["non-number rule value ignored", "a", rule("min_length", "5", "m"), true],
    ["non-string pattern ignored", "a", rule("pattern", 5, "m"), true],
    ["unknown rule ignored", "a", rule("custom", 5, "m"), true],
  ])("%s", (_label, value, single_rule, expected_valid) => {
    expect(validate_field_against_rules(value, [single_rule]).is_valid).toBe(
      expected_valid,
    );
  });

  it("returns the first violated rule message", () => {
    expect(
      validate_field_against_rules("a", [
        rule("max_length", 5, "first"),
        rule("min_length", 3, "second"),
        rule("pattern", "^b", "third"),
      ]),
    ).toEqual({ is_valid: false, error_message: "second" });
  });
});

describe("validate_form_data_against_metadata characterization", () => {
  it("treats non-positive star ratings and empty stage arrays as missing", () => {
    expect(
      validate(
        { rating: 0, stages: [] },
        [
          {
            field_name: "rating",
            display_name: "Rating",
            is_required: true,
            field_type: "star_rating",
          },
          {
            field_name: "stages",
            display_name: "Stages",
            is_required: true,
            field_type: "stage_template_array",
          },
        ],
        false,
      ),
    ).toEqual({
      success: false,
      error: { rating: "Rating is required", stages: "Stages is required" },
    });
  });

  it("skips hidden-on-create and hidden-on-edit fields per mode", () => {
    const fields = [
      {
        field_name: "a",
        display_name: "A",
        is_required: true,
        hide_on_create: true,
      },
      {
        field_name: "b",
        display_name: "B",
        is_required: true,
        hide_on_edit: true,
      },
    ];
    expect(validate({}, fields, false)).toEqual({
      success: false,
      error: { b: "B is required" },
    });
    expect(validate({}, fields, true)).toEqual({
      success: false,
      error: { a: "A is required" },
    });
  });

  it("skips rules for empty optional values and succeeds when all valid", () => {
    const fields = [
      {
        field_name: "code",
        display_name: "Code",
        is_required: false,
        validation_rules: [rule("min_length", 3, "short")],
      },
    ];
    expect(validate({ code: "" }, fields, false)).toEqual({
      success: true,
      data: true,
    });
    expect(validate({ code: "abcd" }, fields, false)).toEqual({
      success: true,
      data: true,
    });
    expect(validate({ code: "ab" }, fields, false)).toEqual({
      success: false,
      error: { code: "short" },
    });
  });
});

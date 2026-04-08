import { beforeEach, describe, expect, it, vi } from "vitest";

const dynamic_form_validation_mocks = vi.hoisted(() => ({
  is_field_visible_by_visible_when_condition: vi.fn(),
  should_field_be_required_for_role: vi.fn(),
}));

vi.mock("./dynamicFormLogic", () => ({
  is_field_visible_by_visible_when_condition:
    dynamic_form_validation_mocks.is_field_visible_by_visible_when_condition,
}));

vi.mock("./systemUserFormLogic", () => ({
  should_field_be_required_for_role:
    dynamic_form_validation_mocks.should_field_be_required_for_role,
}));

import {
  validate_field_against_rules,
  validate_form_data_against_metadata,
} from "./dynamicFormValidation";

describe("dynamicFormValidation", () => {
  beforeEach(() => {
    dynamic_form_validation_mocks.is_field_visible_by_visible_when_condition.mockImplementation(
      (field) => field.field_name !== "hidden_field",
    );
    dynamic_form_validation_mocks.should_field_be_required_for_role.mockReturnValue(
      false,
    );
  });

  it("validates scalar fields against configured string and numeric rules", () => {
    expect(
      validate_field_against_rules("ab", [
        {
          rule_type: "min_length",
          rule_value: 3,
          error_message: "Minimum length is 3",
        },
      ] as never),
    ).toEqual({ is_valid: false, error_message: "Minimum length is 3" });

    expect(
      validate_field_against_rules(11, [
        { rule_type: "max_value", rule_value: 10, error_message: "Too high" },
      ] as never),
    ).toEqual({ is_valid: false, error_message: "Too high" });

    expect(
      validate_field_against_rules("A12", [
        {
          rule_type: "pattern",
          rule_value: "^[A-Z]\\d+$",
          error_message: "Invalid",
        },
      ] as never),
    ).toEqual({ is_valid: true, error_message: "" });
  });

  it("returns required-field errors and skips fields hidden by visibility rules", () => {
    expect(
      validate_form_data_against_metadata(
        { username: "", hidden_field: "" },
        {
          fields: [
            {
              field_name: "username",
              display_name: "Username",
              is_required: true,
              field_type: "text",
            },
            {
              field_name: "hidden_field",
              display_name: "Hidden Field",
              is_required: true,
              field_type: "text",
            },
          ],
        } as never,
        false,
        "player",
      ),
    ).toEqual({
      success: false,
      error: { username: "Username is required" },
    });
  });

  it("adds system-user role requirements and validation rule errors when fields are visible", () => {
    dynamic_form_validation_mocks.should_field_be_required_for_role.mockImplementation(
      (field_name) => field_name === "organization_id",
    );

    expect(
      validate_form_data_against_metadata(
        {
          role: "org_admin",
          organization_id: "",
          display_name: "Long Name",
        },
        {
          fields: [
            {
              field_name: "organization_id",
              display_name: "Organization",
              is_required: false,
              field_type: "text",
            },
            {
              field_name: "display_name",
              display_name: "Display Name",
              is_required: false,
              field_type: "text",
              validation_rules: [
                {
                  rule_type: "max_length",
                  rule_value: 5,
                  error_message: "Display Name is too long",
                },
              ],
            },
          ],
        } as never,
        false,
        "system_user",
      ),
    ).toEqual({
      success: false,
      error: {
        organization_id: "Organization is required",
        display_name: "Display Name is too long",
      },
    });
  });
});

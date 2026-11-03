import { describe, expect, it } from "vitest";

import type { FieldMetadata } from "../../core/entities/BaseEntity";
import { find_shared_field_rule_errors } from "./dynamicFormSharedFieldRules";
import { validate_form_data_against_metadata } from "./dynamicFormValidation";

const NOW_MS = Date.UTC(2026, 10, 3, 12);

function field(field_name: string, display_name: string): FieldMetadata {
  return {
    field_name,
    display_name,
    field_type: "string",
    is_required: false,
    is_read_only: false,
  } as FieldMetadata;
}

const PLAYER_FIELDS = [
  field("first_name", "First Name"),
  field("phone", "Phone Number"),
  field("date_of_birth", "Date of Birth"),
  field("height_cm", "Height (cm)"),
];

describe("form fields checked with the shared rules", () => {
  it("shows each problem under its own field, using the form's label", () => {
    const errors = find_shared_field_rule_errors(
      PLAYER_FIELDS,
      {
        first_name: "Grace",
        phone: "call me",
        date_of_birth: "2031-01-01",
        height_cm: 1_800,
      },
      NOW_MS,
    );
    expect(errors).toEqual({
      phone:
        "Phone Number should be a phone number with 7 to 15 digits, e.g. +256 700 123456.",
      date_of_birth: "Date of Birth can't be in the future.",
      height_cm: "Height (cm) must be between 30 and 300.",
    });
  });

  it("puts a date-order problem on the end date", () => {
    const errors = find_shared_field_rule_errors(
      [field("start_date", "Start Date"), field("end_date", "End Date")],
      { start_date: "2026-06-01", end_date: "2026-05-01" },
      NOW_MS,
    );
    expect(errors).toEqual({
      end_date: "End date can't be before the start date.",
    });
  });

  it("lets optional fields stay empty", () => {
    const result = validate_form_data_against_metadata(
      { first_name: "", phone: "", date_of_birth: "", height_cm: "" },
      { entity_name: "player", display_name: "Player", fields: PLAYER_FIELDS },
      false,
      "player",
    );
    expect(result.success).toBe(true);
  });

  it("refuses to save the form while a filled-in field is wrong", () => {
    const result = validate_form_data_against_metadata(
      { first_name: "Grace", phone: "12" },
      { entity_name: "player", display_name: "Player", fields: PLAYER_FIELDS },
      false,
      "player",
    );
    expect(result.success).toBe(false);
    expect(result.success ? [] : Object.keys(result.error)).toEqual(["phone"]);
  });
});

import { describe, expect, it } from "vitest";

import {
  get_default_value_for_field_type,
  get_sorted_fields_for_display,
} from "./dynamicFormLogic";
import { create_field_metadata } from "./dynamicFormLogic.test_support";

describe("dynamicFormLogic", () => {
  describe("get_default_value_for_field_type", () => {
    it("returns empty string for string fields", () => {
      const field = create_field_metadata({ field_type: "string" });
      expect(get_default_value_for_field_type(field)).toBe("");
    });

    it("returns 0 for required number fields", () => {
      const field = create_field_metadata({
        field_type: "number",
        is_required: true,
      });
      expect(get_default_value_for_field_type(field)).toBe(0);
    });

    it("leaves an optional number blank when its rules reject zero", () => {
      const field = create_field_metadata({
        field_type: "number",
        is_required: false,
        validation_rules: [
          { rule_type: "min_value", rule_value: 1800, error_message: "x" },
        ],
      });
      expect(get_default_value_for_field_type(field)).toBe("");
    });

    it("leaves an optional number blank even when its rules allow zero", () => {
      const field = create_field_metadata({
        field_type: "number",
        is_required: false,
        validation_rules: [
          { rule_type: "min_value", rule_value: 0, error_message: "x" },
        ],
      });
      expect(get_default_value_for_field_type(field)).toBe("");
    });

    it("returns false for boolean fields", () => {
      const field = create_field_metadata({ field_type: "boolean" });
      expect(get_default_value_for_field_type(field)).toBe(false);
    });

    it("returns empty string for date fields", () => {
      const field = create_field_metadata({ field_type: "date" });
      expect(get_default_value_for_field_type(field)).toBe("");
    });

    it("returns empty string for file fields", () => {
      const field = create_field_metadata({ field_type: "file" });
      expect(get_default_value_for_field_type(field)).toBe("");
    });

    it("returns first enum value for required enum fields", () => {
      const field = create_field_metadata({
        field_type: "enum",
        is_required: true,
        enum_values: ["active", "inactive"],
      });
      expect(get_default_value_for_field_type(field)).toBe("active");
    });

    it("leaves a required enum with a long option list empty so the user chooses", () => {
      const field = create_field_metadata({
        field_type: "enum",
        is_required: true,
        enum_values: Array.from(
          { length: 11 },
          (_, index) => `option_${index}`,
        ),
      });
      expect(get_default_value_for_field_type(field)).toBe("");
    });

    it("keeps the first value for a required enum with ten options", () => {
      const field = create_field_metadata({
        field_type: "enum",
        is_required: true,
        enum_values: Array.from(
          { length: 10 },
          (_, index) => `option_${index}`,
        ),
      });
      expect(get_default_value_for_field_type(field)).toBe("option_0");
    });

    it("returns empty string for non-required enum fields", () => {
      const field = create_field_metadata({
        field_type: "enum",
        is_required: false,
        enum_values: ["active", "inactive"],
      });
      expect(get_default_value_for_field_type(field)).toBe("");
    });

    it("returns empty string for enum fields with no values", () => {
      const field = create_field_metadata({
        field_type: "enum",
        is_required: true,
        enum_values: [],
      });
      expect(get_default_value_for_field_type(field)).toBe("");
    });

    it("returns empty string for foreign_key fields", () => {
      const field = create_field_metadata({ field_type: "foreign_key" });
      expect(get_default_value_for_field_type(field)).toBe("");
    });

    it("returns empty array for stage template array fields", () => {
      const field = create_field_metadata({
        field_type: "stage_template_array",
      });
      expect(get_default_value_for_field_type(field)).toEqual([]);
    });
  });

  describe("get_sorted_fields_for_display", () => {
    it("excludes sub_entity fields", () => {
      const fields = [
        create_field_metadata({ field_name: "name", field_type: "string" }),
        create_field_metadata({
          field_name: "qualifications",
          field_type: "sub_entity",
        }),
      ];

      const result = get_sorted_fields_for_display(fields, false);

      expect(result).toHaveLength(1);
      expect(result[0].field_name).toBe("name");
    });

    it("excludes hide_on_create fields in create mode", () => {
      const fields = [
        create_field_metadata({ field_name: "name", field_type: "string" }),
        create_field_metadata({
          field_name: "hidden",
          field_type: "string",
          hide_on_create: true,
        }),
      ];

      const result = get_sorted_fields_for_display(fields, false);

      expect(result).toHaveLength(1);
      expect(result[0].field_name).toBe("name");
    });

    it("includes hide_on_create fields in edit mode", () => {
      const fields = [
        create_field_metadata({ field_name: "name", field_type: "string" }),
        create_field_metadata({
          field_name: "hidden",
          field_type: "string",
          hide_on_create: true,
        }),
      ];

      const result = get_sorted_fields_for_display(fields, true);

      expect(result).toHaveLength(2);
    });

    it("puts file fields first", () => {
      const fields = [
        create_field_metadata({ field_name: "name", field_type: "string" }),
        create_field_metadata({ field_name: "avatar", field_type: "file" }),
        create_field_metadata({ field_name: "email", field_type: "string" }),
      ];

      const result = get_sorted_fields_for_display(fields, false);

      expect(result[0].field_name).toBe("avatar");
      expect(result[0].field_type).toBe("file");
    });
  });
});

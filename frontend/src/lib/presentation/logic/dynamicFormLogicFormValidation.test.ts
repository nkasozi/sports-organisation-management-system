import { describe, expect, it } from "vitest";

import { validate_form_data_against_metadata } from "./dynamicFormLogic";
import {
  create_entity_metadata,
  create_field_metadata,
} from "./dynamicFormLogic.test_support";

describe("dynamicFormLogic", () => {
  describe("validate_form_data_against_metadata", () => {
    it("validates required fields", () => {
      const metadata = create_entity_metadata({
        fields: [
          create_field_metadata({
            field_name: "name",
            is_required: true,
            display_name: "Name",
          }),
        ],
      });

      const result = validate_form_data_against_metadata(
        { name: "" },
        metadata,
        false,
        "",
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error["name"]).toBe("Name is required");
      }
    });

    it("passes when required field has value", () => {
      const metadata = create_entity_metadata({
        fields: [
          create_field_metadata({ field_name: "name", is_required: true }),
        ],
      });

      const result = validate_form_data_against_metadata(
        { name: "Test" },
        metadata,
        false,
        "",
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(true);
      }
    });

    it("validates fields with validation rules", () => {
      const metadata = create_entity_metadata({
        fields: [
          create_field_metadata({
            field_name: "name",
            is_required: false,
            validation_rules: [
              {
                rule_type: "min_length",
                rule_value: 5,
                error_message: "Too short",
              },
            ],
          }),
        ],
      });

      const result = validate_form_data_against_metadata(
        { name: "ab" },
        metadata,
        false,
        "",
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error["name"]).toBe("Too short");
      }
    });

    it("skips validation rules for empty optional fields", () => {
      const metadata = create_entity_metadata({
        fields: [
          create_field_metadata({
            field_name: "name",
            is_required: false,
            validation_rules: [
              {
                rule_type: "min_length",
                rule_value: 5,
                error_message: "Too short",
              },
            ],
          }),
        ],
      });

      const result = validate_form_data_against_metadata(
        { name: "" },
        metadata,
        false,
        "",
      );

      expect(result.success).toBe(true);
    });

    it("collects multiple errors", () => {
      const metadata = create_entity_metadata({
        fields: [
          create_field_metadata({
            field_name: "name",
            is_required: true,
            display_name: "Name",
          }),
          create_field_metadata({
            field_name: "email",
            is_required: true,
            display_name: "Email",
          }),
        ],
      });

      const result = validate_form_data_against_metadata(
        { name: "", email: "" },
        metadata,
        false,
        "",
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(Object.keys(result.error)).toHaveLength(2);
      }
    });
  });
});

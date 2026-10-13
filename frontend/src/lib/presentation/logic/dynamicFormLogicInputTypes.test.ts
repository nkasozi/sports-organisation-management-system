import { describe, expect, it } from "vitest";

import type { ValidationRule } from "../../core/entities/BaseEntity";
import {
  get_input_type_for_field,
  validate_field_against_rules,
} from "./dynamicFormLogic";
import { create_field_metadata } from "./dynamicFormLogic.test_support";

describe("dynamicFormLogic", () => {
  describe("get_input_type_for_field", () => {
    it("returns number for number fields", () => {
      const field = create_field_metadata({ field_type: "number" });
      expect(get_input_type_for_field(field)).toBe("number");
    });

    it("returns date for date fields", () => {
      const field = create_field_metadata({ field_type: "date" });
      expect(get_input_type_for_field(field)).toBe("date");
    });

    it("returns file for file fields", () => {
      const field = create_field_metadata({ field_type: "file" });
      expect(get_input_type_for_field(field)).toBe("file");
    });

    it("returns email for email field names", () => {
      const field = create_field_metadata({
        field_name: "email",
        field_type: "string",
      });
      expect(get_input_type_for_field(field)).toBe("email");
    });

    it("returns tel for phone field names", () => {
      const field = create_field_metadata({
        field_name: "phone",
        field_type: "string",
      });
      expect(get_input_type_for_field(field)).toBe("tel");
    });

    it("returns url for website field names", () => {
      const field = create_field_metadata({
        field_name: "website",
        field_type: "string",
      });
      expect(get_input_type_for_field(field)).toBe("url");
    });

    it("returns text for icon fields even if name contains url", () => {
      const field = create_field_metadata({
        field_name: "icon_url",
        field_type: "string",
      });
      expect(get_input_type_for_field(field)).toBe("text");
    });

    it("returns text for other string fields", () => {
      const field = create_field_metadata({
        field_name: "name",
        field_type: "string",
      });
      expect(get_input_type_for_field(field)).toBe("text");
    });
  });

  describe("validate_field_against_rules", () => {
    it("validates min_length rule", () => {
      const rules = [
        { rule_type: "min_length", rule_value: 3, error_message: "Too short" },
      ] as ValidationRule[];

      expect(validate_field_against_rules("ab", rules).is_valid).toBe(false);
      expect(validate_field_against_rules("abc", rules).is_valid).toBe(true);
      expect(validate_field_against_rules("abcd", rules).is_valid).toBe(true);
    });

    it("validates max_length rule", () => {
      const rules = [
        { rule_type: "max_length", rule_value: 5, error_message: "Too long" },
      ] as ValidationRule[];

      expect(validate_field_against_rules("abcdef", rules).is_valid).toBe(
        false,
      );
      expect(validate_field_against_rules("abcde", rules).is_valid).toBe(true);
      expect(validate_field_against_rules("abc", rules).is_valid).toBe(true);
    });

    it("validates min_value rule", () => {
      const rules = [
        { rule_type: "min_value", rule_value: 10, error_message: "Too small" },
      ] as ValidationRule[];

      expect(validate_field_against_rules(5, rules).is_valid).toBe(false);
      expect(validate_field_against_rules(10, rules).is_valid).toBe(true);
      expect(validate_field_against_rules(15, rules).is_valid).toBe(true);
    });

    it("validates max_value rule", () => {
      const rules = [
        { rule_type: "max_value", rule_value: 100, error_message: "Too large" },
      ] as ValidationRule[];

      expect(validate_field_against_rules(150, rules).is_valid).toBe(false);
      expect(validate_field_against_rules(100, rules).is_valid).toBe(true);
      expect(validate_field_against_rules(50, rules).is_valid).toBe(true);
    });

    it("validates pattern rule", () => {
      const rules = [
        {
          rule_type: "pattern",
          rule_value: "^[A-Z]+$",
          error_message: "Must be uppercase",
        },
      ] as ValidationRule[];

      expect(validate_field_against_rules("abc", rules).is_valid).toBe(false);
      expect(validate_field_against_rules("ABC", rules).is_valid).toBe(true);
    });

    it("returns valid when no rules fail", () => {
      const rules = [] as ValidationRule[];
      expect(validate_field_against_rules("anything", rules).is_valid).toBe(
        true,
      );
    });

    it("returns error message from failed rule", () => {
      const rules = [
        {
          rule_type: "min_length",
          rule_value: 10,
          error_message: "Custom error message",
        },
      ] as ValidationRule[];

      const result = validate_field_against_rules("short", rules);
      expect(result.is_valid).toBe(false);
      expect(result.error_message).toBe("Custom error message");
    });
  });
});

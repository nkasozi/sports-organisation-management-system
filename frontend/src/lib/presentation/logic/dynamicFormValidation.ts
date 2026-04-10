import type { ValidationRule } from "../../core/entities/BaseEntity";
import type { EntityMetadata } from "../../core/entities/BaseEntity";
import type { UserRole } from "../../core/interfaces/ports";
import type { Result } from "../../core/types/Result";
import {
  create_failure_result,
  create_success_result,
} from "../../core/types/Result";
import { is_field_visible_by_visible_when_condition } from "./dynamicFormLogic";
import { should_field_be_required_for_role } from "./systemUserFormLogic";

interface FieldValidationResult {
  is_valid: boolean;
  error_message: string;
}

export function validate_field_against_rules(
  value: any,
  rules: ValidationRule[],
): FieldValidationResult {
  for (const rule of rules) {
    if (
      rule.rule_type === "min_length" &&
      typeof value === "string" &&
      typeof rule.rule_value === "number" &&
      value.length < rule.rule_value
    ) {
      return { is_valid: false, error_message: rule.error_message };
    }
    if (
      rule.rule_type === "max_length" &&
      typeof value === "string" &&
      typeof rule.rule_value === "number" &&
      value.length > rule.rule_value
    ) {
      return { is_valid: false, error_message: rule.error_message };
    }
    if (
      rule.rule_type === "min_value" &&
      typeof value === "number" &&
      typeof rule.rule_value === "number" &&
      value < rule.rule_value
    ) {
      return { is_valid: false, error_message: rule.error_message };
    }
    if (
      rule.rule_type === "max_value" &&
      typeof value === "number" &&
      typeof rule.rule_value === "number" &&
      value > rule.rule_value
    ) {
      return { is_valid: false, error_message: rule.error_message };
    }
    if (
      rule.rule_type === "pattern" &&
      typeof value === "string" &&
      typeof rule.rule_value === "string" &&
      !new RegExp(rule.rule_value).test(value)
    ) {
      return { is_valid: false, error_message: rule.error_message };
    }
  }
  return { is_valid: true, error_message: "" };
}

export function validate_form_data_against_metadata(
  data: Record<string, any>,
  metadata: EntityMetadata,
  is_edit_mode: boolean,
  entity_type: string,
): Result<boolean, Record<string, string>> {
  const errors: Record<string, string> = {};
  const is_system_user_entity =
    entity_type.toLowerCase().replace(/[\s_-]/g, "") === "systemuser";
  const selected_role = is_system_user_entity
    ? (data["role"] as UserRole | null)
    : null;

  for (const field of metadata.fields) {
    if (!is_field_visible_by_visible_when_condition(field, data)) continue;
    if (!is_edit_mode && field.hide_on_create) continue;
    if (is_edit_mode && field.hide_on_edit) continue;

    const field_value = data[field.field_name];
    const is_dynamically_required =
      is_system_user_entity &&
      should_field_be_required_for_role(field.field_name, selected_role);
    const is_required = field.is_required || is_dynamically_required;

    const is_empty_scalar =
      field_value === "" || field_value === null || field_value === undefined;
    const is_empty_star_rating =
      field.field_type === "star_rating" &&
      (typeof field_value !== "number" || field_value <= 0);
    const is_empty_array =
      field.field_type === "stage_template_array" &&
      Array.isArray(field_value) &&
      field_value.length === 0;

    if (
      is_required &&
      (is_empty_scalar || is_empty_star_rating || is_empty_array)
    ) {
      errors[field.field_name] = `${field.display_name} is required`;
      continue;
    }

    if (
      field.validation_rules &&
      field_value !== "" &&
      field_value !== null &&
      field_value !== undefined
    ) {
      const rule_validation_result = validate_field_against_rules(
        field_value,
        field.validation_rules,
      );
      if (!rule_validation_result.is_valid) {
        errors[field.field_name] = rule_validation_result.error_message;
      }
    }
  }

  if (Object.keys(errors).length > 0) return create_failure_result(errors);
  return create_success_result(true);
}

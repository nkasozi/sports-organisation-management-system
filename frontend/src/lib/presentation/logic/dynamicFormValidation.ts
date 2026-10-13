import type {
  EntityMetadata,
  FieldMetadata,
  ValidationRule,
} from "../../core/entities/BaseEntity";
import type { Result } from "../../core/types/Result";
import {
  create_failure_result,
  create_success_result,
} from "../../core/types/Result";
import {
  DYNAMIC_FORM_FIELD_TYPE,
  DYNAMIC_FORM_REQUIRED_SUFFIX,
  DYNAMIC_FORM_ROLE_FIELD_NAME,
  DYNAMIC_FORM_SYSTEM_USER_ENTITY_KEY,
  DYNAMIC_FORM_VALIDATION_RULE_TYPE,
  type DynamicFormData,
  is_dynamic_form_entity_type,
} from "./dynamicFormConstants";
import { is_field_visible_by_visible_when_condition } from "./dynamicFormLogic";
import { PRESENCE_STATUS } from "./presenceStatus";
import { is_number_value, is_string_value } from "./runtimeTypeGuards";
import {
  build_user_role_state,
  should_field_be_required_for_role,
} from "./systemUserFormLogic";

interface FieldValidationResult {
  is_valid: boolean;
  error_message: string;
}

type FieldErrorState =
  | { status: typeof PRESENCE_STATUS.MISSING }
  | { status: typeof PRESENCE_STATUS.PRESENT; error_message: string };

const NO_FIELD_ERROR: FieldErrorState = { status: PRESENCE_STATUS.MISSING };

function is_less_than(actual: number, limit: number): boolean {
  return actual < limit;
}

function is_greater_than(actual: number, limit: number): boolean {
  return actual > limit;
}

function is_length_rule_violated(
  value: unknown,
  rule: ValidationRule,
  comparison: (actual: number, limit: number) => boolean,
): boolean {
  if (!is_string_value(value) || !is_number_value(rule.rule_value))
    return false;
  return comparison(value.length, rule.rule_value);
}

function is_value_rule_violated(
  value: unknown,
  rule: ValidationRule,
  comparison: (actual: number, limit: number) => boolean,
): boolean {
  if (!is_number_value(value) || !is_number_value(rule.rule_value))
    return false;
  return comparison(value, rule.rule_value);
}

function is_pattern_rule_violated(
  value: unknown,
  rule: ValidationRule,
): boolean {
  return (
    is_string_value(value) &&
    is_string_value(rule.rule_value) &&
    !new RegExp(rule.rule_value).test(value)
  );
}

function is_rule_violated(value: unknown, rule: ValidationRule): boolean {
  switch (rule.rule_type) {
    case DYNAMIC_FORM_VALIDATION_RULE_TYPE.MIN_LENGTH:
      return is_length_rule_violated(value, rule, is_less_than);
    case DYNAMIC_FORM_VALIDATION_RULE_TYPE.MAX_LENGTH:
      return is_length_rule_violated(value, rule, is_greater_than);
    case DYNAMIC_FORM_VALIDATION_RULE_TYPE.MIN_VALUE:
      return is_value_rule_violated(value, rule, is_less_than);
    case DYNAMIC_FORM_VALIDATION_RULE_TYPE.MAX_VALUE:
      return is_value_rule_violated(value, rule, is_greater_than);
    case DYNAMIC_FORM_VALIDATION_RULE_TYPE.PATTERN:
      return is_pattern_rule_violated(value, rule);
    case DYNAMIC_FORM_VALIDATION_RULE_TYPE.CUSTOM:
      return false;
  }
}

export function validate_field_against_rules(
  value: unknown,
  rules: ValidationRule[],
): FieldValidationResult {
  const violated_rule = rules.find((rule: ValidationRule) =>
    is_rule_violated(value, rule),
  );
  return violated_rule
    ? { is_valid: false, error_message: violated_rule.error_message }
    : { is_valid: true, error_message: "" };
}

function is_field_skipped_for_validation(
  field: FieldMetadata,
  data: DynamicFormData,
  is_edit_mode: boolean,
): boolean {
  if (!is_field_visible_by_visible_when_condition(field, data)) return true;
  if (!is_edit_mode && field.hide_on_create) return true;
  return Boolean(is_edit_mode && field.hide_on_edit);
}

function is_empty_scalar_value(field_value: unknown): boolean {
  return (
    field_value == void 0 || (is_string_value(field_value) && !field_value)
  );
}

function is_field_value_missing(
  field: FieldMetadata,
  field_value: unknown,
): boolean {
  const is_empty_scalar = is_empty_scalar_value(field_value);
  const is_empty_star_rating =
    field.field_type === DYNAMIC_FORM_FIELD_TYPE.STAR_RATING &&
    (!is_number_value(field_value) || field_value <= 0);
  const is_empty_array =
    field.field_type === DYNAMIC_FORM_FIELD_TYPE.STAGE_TEMPLATE_ARRAY &&
    Array.isArray(field_value) &&
    field_value.length === 0;
  return is_empty_scalar || is_empty_star_rating || is_empty_array;
}

function get_field_error_state(
  field: FieldMetadata,
  field_value: unknown,
  is_required: boolean,
): FieldErrorState {
  if (is_required && is_field_value_missing(field, field_value)) {
    return {
      status: PRESENCE_STATUS.PRESENT,
      error_message: `${field.display_name} ${DYNAMIC_FORM_REQUIRED_SUFFIX}`,
    };
  }
  if (!field.validation_rules || is_empty_scalar_value(field_value))
    return NO_FIELD_ERROR;
  const rule_validation_result = validate_field_against_rules(
    field_value,
    field.validation_rules,
  );
  return rule_validation_result.is_valid
    ? NO_FIELD_ERROR
    : {
        status: PRESENCE_STATUS.PRESENT,
        error_message: rule_validation_result.error_message,
      };
}

export function validate_form_data_against_metadata(
  data: DynamicFormData,
  metadata: EntityMetadata,
  is_edit_mode: boolean,
  entity_type: string,
): Result<boolean, Record<string, string>> {
  const errors: Record<string, string> = {};
  const is_system_user_entity = is_dynamic_form_entity_type(
    entity_type,
    DYNAMIC_FORM_SYSTEM_USER_ENTITY_KEY,
  );
  const selected_role = is_system_user_entity
    ? build_user_role_state(data[DYNAMIC_FORM_ROLE_FIELD_NAME])
    : build_user_role_state();

  for (const field of metadata.fields) {
    if (is_field_skipped_for_validation(field, data, is_edit_mode)) continue;
    const is_required =
      field.is_required ||
      (is_system_user_entity &&
        should_field_be_required_for_role(field.field_name, selected_role));
    const error_state = get_field_error_state(
      field,
      data[field.field_name],
      is_required,
    );
    if (error_state.status === PRESENCE_STATUS.PRESENT)
      errors[field.field_name] = error_state.error_message;
  }

  if (Object.keys(errors).length > 0) return create_failure_result(errors);
  return create_success_result(true);
}

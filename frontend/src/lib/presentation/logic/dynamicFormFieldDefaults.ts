import type { FieldMetadata } from "$lib/core/entities/BaseEntity";

import {
  DYNAMIC_FORM_FIELD_NAME_HINT,
  DYNAMIC_FORM_FIELD_TYPE,
  DYNAMIC_FORM_INPUT_TYPE,
  DYNAMIC_FORM_VALIDATION_RULE_TYPE,
  type DynamicFormInputType,
} from "./dynamicFormConstants";
import { is_number_value } from "./runtimeTypeGuards";

const EMPTY_TEXT_VALUE = "";
const ZERO_NUMERIC_VALUE = 0;

function get_default_enum_value(field: FieldMetadata): string {
  if (!field.enum_values || field.enum_values.length === 0)
    return EMPTY_TEXT_VALUE;
  if (!field.is_required) return EMPTY_TEXT_VALUE;
  return field.enum_values[0];
}

function is_zero_rejected_by_rules(field: FieldMetadata): boolean {
  return (field.validation_rules ?? []).some(
    (rule) =>
      rule.rule_type === DYNAMIC_FORM_VALIDATION_RULE_TYPE.MIN_VALUE &&
      is_number_value(rule.rule_value) &&
      rule.rule_value > ZERO_NUMERIC_VALUE,
  );
}

function get_default_number_value(field: FieldMetadata): number | string {
  if (!field.is_required && is_zero_rejected_by_rules(field))
    return EMPTY_TEXT_VALUE;
  return ZERO_NUMERIC_VALUE;
}

export function get_default_value_for_field_type(
  field: FieldMetadata,
): unknown {
  switch (field.field_type) {
    case DYNAMIC_FORM_FIELD_TYPE.NUMBER:
      return get_default_number_value(field);
    case DYNAMIC_FORM_FIELD_TYPE.STAR_RATING:
      return ZERO_NUMERIC_VALUE;
    case DYNAMIC_FORM_FIELD_TYPE.BOOLEAN:
      return false;
    case DYNAMIC_FORM_FIELD_TYPE.ENUM:
      return get_default_enum_value(field);
    case DYNAMIC_FORM_FIELD_TYPE.STAGE_TEMPLATE_ARRAY:
      return [];
    case DYNAMIC_FORM_FIELD_TYPE.STRING:
    case DYNAMIC_FORM_FIELD_TYPE.DATE:
    case DYNAMIC_FORM_FIELD_TYPE.FILE:
    case DYNAMIC_FORM_FIELD_TYPE.FOREIGN_KEY:
    case DYNAMIC_FORM_FIELD_TYPE.SUB_ENTITY:
    case DYNAMIC_FORM_FIELD_TYPE.OFFICIAL_ASSIGNMENT_ARRAY:
      return EMPTY_TEXT_VALUE;
  }
}

function field_name_includes_any(
  field_name: string,
  hints: readonly string[],
): boolean {
  return hints.some((hint) => field_name.includes(hint));
}

function get_input_type_from_field_name(
  field_name: string,
): DynamicFormInputType {
  if (field_name.includes(DYNAMIC_FORM_FIELD_NAME_HINT.EMAIL))
    return DYNAMIC_FORM_INPUT_TYPE.EMAIL;
  if (
    field_name_includes_any(field_name, [
      DYNAMIC_FORM_FIELD_NAME_HINT.PHONE,
      DYNAMIC_FORM_FIELD_NAME_HINT.TEL,
    ])
  )
    return DYNAMIC_FORM_INPUT_TYPE.TEL;
  if (field_name.includes(DYNAMIC_FORM_FIELD_NAME_HINT.ICON))
    return DYNAMIC_FORM_INPUT_TYPE.TEXT;
  if (
    field_name_includes_any(field_name, [
      DYNAMIC_FORM_FIELD_NAME_HINT.URL,
      DYNAMIC_FORM_FIELD_NAME_HINT.WEBSITE,
      DYNAMIC_FORM_FIELD_NAME_HINT.LINK,
    ])
  )
    return DYNAMIC_FORM_INPUT_TYPE.URL;
  return DYNAMIC_FORM_INPUT_TYPE.TEXT;
}

export function get_input_type_for_field(
  field: FieldMetadata,
): DynamicFormInputType {
  switch (field.field_type) {
    case DYNAMIC_FORM_FIELD_TYPE.NUMBER:
      return DYNAMIC_FORM_INPUT_TYPE.NUMBER;
    case DYNAMIC_FORM_FIELD_TYPE.DATE:
      return DYNAMIC_FORM_INPUT_TYPE.DATE;
    case DYNAMIC_FORM_FIELD_TYPE.FILE:
      return DYNAMIC_FORM_INPUT_TYPE.FILE;
    case DYNAMIC_FORM_FIELD_TYPE.STRING:
    case DYNAMIC_FORM_FIELD_TYPE.STAR_RATING:
    case DYNAMIC_FORM_FIELD_TYPE.BOOLEAN:
    case DYNAMIC_FORM_FIELD_TYPE.ENUM:
    case DYNAMIC_FORM_FIELD_TYPE.FOREIGN_KEY:
    case DYNAMIC_FORM_FIELD_TYPE.SUB_ENTITY:
    case DYNAMIC_FORM_FIELD_TYPE.OFFICIAL_ASSIGNMENT_ARRAY:
    case DYNAMIC_FORM_FIELD_TYPE.STAGE_TEMPLATE_ARRAY:
      return get_input_type_from_field_name(field.field_name);
  }
}

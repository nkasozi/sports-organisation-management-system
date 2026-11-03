import {
  check_field_value,
  find_record_field_errors,
} from "$convex/shared_field_rules";

import type { FieldMetadata } from "../../core/entities/BaseEntity";
import type { DynamicFormData } from "./dynamicFormConstants";

export function find_shared_field_rule_errors(
  checked_fields: FieldMetadata[],
  data: DynamicFormData,
  now_ms: number = Date.now(),
): Record<string, string> {
  const record_errors = find_record_field_errors(data, now_ms);
  const errors: Record<string, string> = {};
  for (const field of checked_fields) {
    const check = check_field_value(
      field.field_name,
      data[field.field_name],
      now_ms,
      field.display_name,
    );
    const message = check.is_valid
      ? (record_errors[field.field_name] ?? "")
      : check.message;
    if (message) errors[field.field_name] = message;
  }
  return errors;
}

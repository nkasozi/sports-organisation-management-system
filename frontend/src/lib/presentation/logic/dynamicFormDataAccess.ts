import type { DynamicFormData } from "./dynamicFormConstants";
import { is_string_value } from "./runtimeTypeGuards";

const EMPTY_TEXT_VALUE = "";

export function read_dynamic_form_text_value(
  form_data: DynamicFormData,
  field_name: string,
): string {
  const value = form_data[field_name];
  return is_string_value(value) ? value : EMPTY_TEXT_VALUE;
}

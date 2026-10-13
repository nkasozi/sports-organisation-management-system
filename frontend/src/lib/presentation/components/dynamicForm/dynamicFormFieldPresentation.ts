import type { FieldMetadata } from "$lib/core/entities/BaseEntity";
import { DYNAMIC_FORM_FIELD_TYPE } from "$lib/presentation/logic/dynamicFormConstants";

const FULL_WIDTH_STRING_FIELD_NAME_HINTS = ["description", "address", "notes"];
const ALWAYS_FULL_WIDTH_FIELD_TYPES: FieldMetadata["field_type"][] = [
  DYNAMIC_FORM_FIELD_TYPE.FILE,
  DYNAMIC_FORM_FIELD_TYPE.STAGE_TEMPLATE_ARRAY,
];
const FIELD_TYPES_WITH_OWN_ERROR_DISPLAY: FieldMetadata["field_type"][] = [
  DYNAMIC_FORM_FIELD_TYPE.ENUM,
  DYNAMIC_FORM_FIELD_TYPE.FOREIGN_KEY,
];
const EMPTY_STRING_VALUE = "";
const EMPTY_NUMBER_VALUE = 0;

export function is_full_width_dynamic_form_field(
  field: FieldMetadata,
): boolean {
  if (ALWAYS_FULL_WIDTH_FIELD_TYPES.includes(field.field_type)) return true;
  if (field.field_type !== DYNAMIC_FORM_FIELD_TYPE.STRING) return false;
  return is_multiline_string_field_name(field.field_name);
}

export function shows_shared_validation_error(
  field_type: FieldMetadata["field_type"],
): boolean {
  return !FIELD_TYPES_WITH_OWN_ERROR_DISPLAY.includes(field_type);
}

export function to_form_string_value(value: unknown): string {
  return typeof value === typeof EMPTY_STRING_VALUE
    ? (value as string)
    : EMPTY_STRING_VALUE;
}

export function to_form_number_value(value: unknown): number {
  return typeof value === typeof EMPTY_NUMBER_VALUE
    ? (value as number)
    : EMPTY_NUMBER_VALUE;
}

export const DYNAMIC_FORM_FALLBACK_IMAGE_PATH = "/no-image.svg";

export function is_fallback_image_source(image_source: string): boolean {
  return image_source.endsWith(DYNAMIC_FORM_FALLBACK_IMAGE_PATH);
}

export function is_multiline_string_field_name(field_name: string): boolean {
  return FULL_WIDTH_STRING_FIELD_NAME_HINTS.some((hint: string) =>
    field_name.includes(hint),
  );
}

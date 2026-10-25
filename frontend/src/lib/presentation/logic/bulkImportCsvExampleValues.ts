import type { FieldMetadata } from "$lib/core/entities/BaseEntity";
import {
  BULK_IMPORT_EXAMPLE_VALUES,
  BULK_IMPORT_NUMBER_FIELD_HINTS,
  BULK_IMPORT_STRING_FIELD_HINTS,
} from "$lib/presentation/logic/bulkImportConstants";
import { DYNAMIC_FORM_FIELD_TYPE } from "$lib/presentation/logic/dynamicFormConstants";

function pick_hinted_example_value(
  field_name: string,
  hints: ReadonlyArray<readonly [string, string]>,
  fallback_value: string,
): string {
  const matching_hint = hints.find(([hint]) => field_name.includes(hint));
  return matching_hint ? matching_hint[1] : fallback_value;
}

export function generate_bulk_import_example_value(
  field: FieldMetadata,
): string {
  switch (field.field_type) {
    case DYNAMIC_FORM_FIELD_TYPE.STRING:
      return pick_hinted_example_value(
        field.field_name,
        BULK_IMPORT_STRING_FIELD_HINTS,
        BULK_IMPORT_EXAMPLE_VALUES.TEXT,
      );
    case DYNAMIC_FORM_FIELD_TYPE.NUMBER:
      return pick_hinted_example_value(
        field.field_name,
        BULK_IMPORT_NUMBER_FIELD_HINTS,
        BULK_IMPORT_EXAMPLE_VALUES.NUMBER,
      );
    case DYNAMIC_FORM_FIELD_TYPE.DATE:
      return BULK_IMPORT_EXAMPLE_VALUES.DATE;
    case DYNAMIC_FORM_FIELD_TYPE.BOOLEAN:
      return BULK_IMPORT_EXAMPLE_VALUES.BOOLEAN;
    case DYNAMIC_FORM_FIELD_TYPE.ENUM:
      return field.enum_values?.[0] || BULK_IMPORT_EXAMPLE_VALUES.ENUM;
    case DYNAMIC_FORM_FIELD_TYPE.FOREIGN_KEY:
      if (field.foreign_key_value_field) return BULK_IMPORT_EXAMPLE_VALUES.TEXT;
      return `${field.foreign_key_entity?.toLowerCase() || BULK_IMPORT_EXAMPLE_VALUES.ENTITY}${BULK_IMPORT_EXAMPLE_VALUES.FOREIGN_KEY_SUFFIX}`;
    case DYNAMIC_FORM_FIELD_TYPE.STAR_RATING:
    case DYNAMIC_FORM_FIELD_TYPE.FILE:
    case DYNAMIC_FORM_FIELD_TYPE.SUB_ENTITY:
    case DYNAMIC_FORM_FIELD_TYPE.OFFICIAL_ASSIGNMENT_ARRAY:
    case DYNAMIC_FORM_FIELD_TYPE.STAGE_TEMPLATE_ARRAY:
      return BULK_IMPORT_EXAMPLE_VALUES.NONE;
  }
}

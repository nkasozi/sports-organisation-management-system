import type { BaseEntity, FieldMetadata } from "../../core/entities/BaseEntity";
import { build_entity_display_label } from "./dynamicFormLogic";
import {
  LIST_BOOLEAN_LABEL,
  LIST_ENTITY_ID_FIELD_NAME,
  LIST_FOREIGN_KEY_FIELD_TYPE,
} from "./listConstants";
import { is_boolean_value } from "./runtimeTypeGuards";

function format_enum_style_string(value: string): string {
  return value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function is_enum_style_string(value: string): boolean {
  if (value.includes("_")) return true;
  return (
    value === value.toLowerCase() && !value.includes(" ") && value.length > 0
  );
}

function find_label_in_options(
  options: Array<{ value: string; label: string }>,
  raw_value: string,
): string {
  return options.find((option) => option.value === raw_value)?.label ?? "";
}

function find_enum_option_label(
  field_metadata: FieldMetadata | undefined,
  raw_value: string,
): string {
  if (!field_metadata) return "";
  const direct_label = find_label_in_options(
    field_metadata.enum_options ?? [],
    raw_value,
  );
  if (direct_label) return direct_label;
  const dependent_option_groups = Object.values(
    field_metadata.enum_dependency?.options_map ?? {},
  );
  for (const options of dependent_option_groups) {
    const dependent_label = find_label_in_options(options, raw_value);
    if (dependent_label) return dependent_label;
  }
  return "";
}

function find_foreign_key_option_label(
  foreign_key_options: Record<string, BaseEntity[]>,
  field_name: string,
  raw_value: unknown,
): string {
  const matched_option = (foreign_key_options[field_name] ?? []).find(
    (option) => option.id === raw_value,
  );
  return matched_option ? build_entity_display_label(matched_option) : "";
}

export function get_display_value_for_entity_field(
  entity: BaseEntity,
  field_name: string,
  foreign_key_options: Record<string, BaseEntity[]>,
  field_metadata?: FieldMetadata,
): string {
  if (!entity || !field_name) return "";
  const raw_value = (entity as unknown as Record<string, unknown>)[field_name];
  if (raw_value == void 0) return "";

  const is_entity_id_field = field_name === LIST_ENTITY_ID_FIELD_NAME;
  const is_foreign_key_field =
    field_metadata?.field_type === LIST_FOREIGN_KEY_FIELD_TYPE;
  const has_foreign_key_options =
    Boolean(foreign_key_options) && field_name in foreign_key_options;
  const foreign_key_label =
    !is_entity_id_field && has_foreign_key_options
      ? find_foreign_key_option_label(
          foreign_key_options,
          field_name,
          raw_value,
        )
      : "";

  if (foreign_key_label) return foreign_key_label;
  if (!is_entity_id_field && is_foreign_key_field) return String(raw_value);
  if (is_boolean_value(raw_value)) {
    return raw_value ? LIST_BOOLEAN_LABEL.TRUE : LIST_BOOLEAN_LABEL.FALSE;
  }
  if (raw_value instanceof Date) return raw_value.toLocaleDateString();

  const string_value = String(raw_value);
  if (is_entity_id_field) return string_value;

  const enum_label = find_enum_option_label(field_metadata, string_value);
  if (enum_label) return enum_label;
  if (is_enum_style_string(string_value))
    return format_enum_style_string(string_value);

  return string_value;
}

import type { BaseEntity, FieldMetadata } from "../../core/entities/BaseEntity";
import { build_entity_display_label } from "./dynamicFormLogic";

function format_enum_style_string(value: string): string {
  return value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function is_enum_style_string(value: string): boolean {
  if (typeof value !== "string") return false;
  if (value.includes("_")) return true;
  return (
    value === value.toLowerCase() && !value.includes(" ") && value.length > 0
  );
}

function find_enum_option_label(
  field_metadata: FieldMetadata | undefined,
  raw_value: string,
): string | null {
  if (!field_metadata) return null;
  if (field_metadata.enum_options) {
    const option = field_metadata.enum_options.find(
      (opt) => opt.value === raw_value,
    );
    if (option) return option.label;
  }
  if (field_metadata.enum_dependency) {
    for (const options of Object.values(
      field_metadata.enum_dependency.options_map,
    )) {
      const option = options.find((opt) => opt.value === raw_value);
      if (option) return option.label;
    }
  }
  return null;
}

export function get_display_value_for_entity_field(
  entity: BaseEntity,
  field_name: string,
  foreign_key_options: Record<string, BaseEntity[]>,
  field_metadata?: FieldMetadata,
): string {
  if (!entity || !field_name) return "";
  const raw_value = (entity as unknown as Record<string, unknown>)[field_name];
  if (raw_value === null || raw_value === undefined) return "";

  const is_entity_id_field = field_name === "id";
  const is_foreign_key_field = field_metadata?.field_type === "foreign_key";
  const has_foreign_key_options =
    foreign_key_options && field_name in foreign_key_options;

  if (
    !is_entity_id_field &&
    (is_foreign_key_field || has_foreign_key_options)
  ) {
    if (has_foreign_key_options) {
      const matched_option = foreign_key_options[field_name].find(
        (option) => option.id === raw_value,
      );
      if (matched_option) return build_entity_display_label(matched_option);
    }
    if (is_foreign_key_field) return String(raw_value);
  }

  if (typeof raw_value === "boolean") return raw_value ? "Yes" : "No";
  if (raw_value instanceof Date) return raw_value.toLocaleDateString();

  const string_value = String(raw_value);
  if (is_entity_id_field) return string_value;

  const enum_label = find_enum_option_label(field_metadata, string_value);
  if (enum_label) return enum_label;
  if (is_enum_style_string(string_value))
    return format_enum_style_string(string_value);

  return string_value;
}

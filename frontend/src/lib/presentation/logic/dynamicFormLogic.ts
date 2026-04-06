import type {
  FieldMetadata,
  EntityMetadata,
  BaseEntity,
} from "../../core/entities/BaseEntity";
import type { SubEntityFilter } from "../../core/types/SubEntityFilter";

export {
  validate_form_data_against_metadata,
  validate_field_against_rules,
  type FieldValidationResult,
} from "./dynamicFormValidation";
export {
  build_entity_display_label,
  get_display_value_for_foreign_key,
  format_entity_display_name,
  format_enum_label,
  build_foreign_entity_route,
  build_foreign_entity_cta_label,
} from "./entityDisplayFormatter";
export {
  build_foreign_key_select_options,
  type ForeignKeySelectOption,
} from "./foreignKeyOptionBuilder";
export { is_jersey_color_field } from "./foreignKeyOptionBuilder";

export function determine_if_edit_mode(
  data: Partial<BaseEntity> | null,
): boolean {
  return data !== null && data.id !== undefined;
}

export function build_form_title(
  display_name: string,
  edit_mode: boolean,
): string {
  return `${edit_mode ? "Edit" : "Create"} ${display_name}`;
}

export function get_sub_entity_fields(
  metadata: EntityMetadata | null,
): FieldMetadata[] {
  if (!metadata) return [];
  return metadata.fields.filter((field) => field.field_type === "sub_entity");
}

export function build_sub_entity_filter(
  field: FieldMetadata,
  parent_entity: Partial<BaseEntity> | null,
): SubEntityFilter | null {
  if (!field.sub_entity_config || !parent_entity?.id) return null;
  const config = field.sub_entity_config;
  return {
    foreign_key_field: config.foreign_key_field,
    foreign_key_value: parent_entity.id,
    holder_type_field: config.holder_type_field,
    holder_type_value: config.holder_type_value,
  };
}

export function get_default_value_for_field_type(field: FieldMetadata): any {
  if (field.field_type === "string") return "";
  if (field.field_type === "number") return 0;
  if (field.field_type === "star_rating") return 0;
  if (field.field_type === "boolean") return false;
  if (field.field_type === "date") return "";
  if (field.field_type === "file") return "";
  if (field.field_type === "enum") {
    if (!field.enum_values || field.enum_values.length === 0) return "";
    if (!field.is_required) return "";
    return field.enum_values[0];
  }
  if (field.field_type === "foreign_key") return "";
  if (field.field_type === "stage_template_array") return [];
  return "";
}

export function get_sorted_fields_for_display(
  fields: FieldMetadata[],
  in_edit_mode: boolean,
): FieldMetadata[] {
  const renderable_fields = fields.filter((f) => f.field_type !== "sub_entity");
  const visible_fields = renderable_fields.filter(
    (f) => !(!in_edit_mode && f.hide_on_create),
  );
  const file_fields = visible_fields.filter((f) => f.field_type === "file");
  const other_fields = visible_fields.filter((f) => f.field_type !== "file");
  return [...file_fields, ...other_fields];
}

export function get_input_type_for_field(field: FieldMetadata): string {
  if (field.field_type === "number") return "number";
  if (field.field_type === "date") return "date";
  if (field.field_type === "file") return "file";
  if (field.field_name.includes("email")) return "email";
  if (field.field_name.includes("phone") || field.field_name.includes("tel"))
    return "tel";
  if (field.field_name.includes("icon")) return "text";
  if (
    field.field_name.includes("url") ||
    field.field_name.includes("website") ||
    field.field_name.includes("link")
  )
    return "url";
  return "text";
}

export function initialize_form_data_from_metadata(
  metadata: EntityMetadata,
  existing_data: Partial<BaseEntity> | null,
): Record<string, any> {
  const new_form_data: Record<string, any> = {};
  for (const field of metadata.fields) {
    if (
      existing_data &&
      existing_data[field.field_name as keyof BaseEntity] !== undefined
    ) {
      new_form_data[field.field_name] =
        existing_data[field.field_name as keyof BaseEntity];
    } else {
      new_form_data[field.field_name] = get_default_value_for_field_type(field);
    }
  }
  return new_form_data;
}

export function is_field_visible_by_visible_when_condition(
  field: FieldMetadata,
  current_form_data: Record<string, any>,
): boolean {
  if (!field.visible_when) return true;
  const dependency_value =
    current_form_data[field.visible_when.depends_on_field];
  if (!dependency_value) return false;
  return field.visible_when.visible_when_values.includes(dependency_value);
}

export function is_field_controlled_by_sub_entity_filter(
  field_name: string,
  filter: SubEntityFilter | null,
): boolean {
  if (!filter) return false;
  if (field_name === filter.foreign_key_field) return true;
  if (filter.holder_type_field && field_name === filter.holder_type_field)
    return true;
  return false;
}

export function should_field_be_read_only(
  field: FieldMetadata,
  is_edit_mode: boolean,
  auth_restricted_fields: Set<string>,
  sub_entity_filter: SubEntityFilter | null,
): boolean {
  if (field.is_read_only) return true;
  if (field.is_read_only_on_edit && is_edit_mode) return true;
  if (field.is_read_only_on_create && !is_edit_mode) return true;
  if (auth_restricted_fields.has(field.field_name)) return true;
  return is_field_controlled_by_sub_entity_filter(
    field.field_name,
    sub_entity_filter,
  );
}

export function convert_file_to_base64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}

export function has_enum_options(field: FieldMetadata): boolean {
  if (field.enum_options && field.enum_options.length > 0) return true;
  if (field.enum_values && field.enum_values.length > 0) return true;
  if (field.enum_dependency) return true;
  return false;
}

export function find_dependent_enum_fields(
  metadata: EntityMetadata,
  parent_field_name: string,
): FieldMetadata[] {
  return metadata.fields.filter(
    (field) =>
      field.enum_dependency &&
      field.enum_dependency.depends_on_field === parent_field_name,
  );
}

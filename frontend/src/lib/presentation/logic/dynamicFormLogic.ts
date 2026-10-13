import type {
  BaseEntity,
  EntityMetadata,
  FieldMetadata,
} from "../../core/entities/BaseEntity";
import type { ScalarInput } from "../../core/types/DomainScalars";
import type { SubEntityFilter } from "../../core/types/SubEntityFilter";
import {
  DYNAMIC_FORM_FIELD_TYPE,
  DYNAMIC_FORM_TITLE_PREFIX,
  type DynamicFormData,
} from "./dynamicFormConstants";
import { get_default_value_for_field_type } from "./dynamicFormFieldDefaults";
import { is_string_value } from "./runtimeTypeGuards";

type BaseEntityInput = Partial<BaseEntity> | Partial<ScalarInput<BaseEntity>>;

export {
  get_default_value_for_field_type,
  get_input_type_for_field,
} from "./dynamicFormFieldDefaults";
export { convert_file_to_base64 } from "./dynamicFormFileEncoding";
export {
  validate_field_against_rules,
  validate_form_data_against_metadata,
} from "./dynamicFormValidation";
export {
  build_entity_display_label,
  build_foreign_entity_cta_label,
  build_foreign_entity_route,
  format_entity_display_name,
  format_enum_label,
  get_display_value_for_foreign_key,
} from "./entityDisplayFormatter";
export { build_foreign_key_select_options } from "./foreignKeyOptionBuilder";
export { is_jersey_color_field } from "./foreignKeyOptionBuilder";

export function determine_if_edit_mode(data?: BaseEntityInput): boolean {
  return is_string_value(data?.id) && data.id.length > 0;
}

export function build_form_title(
  display_name: string,
  edit_mode: boolean,
): string {
  return `${edit_mode ? DYNAMIC_FORM_TITLE_PREFIX.EDIT : DYNAMIC_FORM_TITLE_PREFIX.CREATE} ${display_name}`;
}

export function get_sub_entity_fields(
  metadata?: EntityMetadata,
): FieldMetadata[] {
  if (!metadata) return [];
  return metadata.fields.filter(
    (field) => field.field_type === DYNAMIC_FORM_FIELD_TYPE.SUB_ENTITY,
  );
}

export function build_sub_entity_filter(
  field: FieldMetadata,
  parent_entity?: BaseEntityInput,
): SubEntityFilter | undefined {
  if (!field.sub_entity_config || !parent_entity?.id) return;
  const config = field.sub_entity_config;
  return {
    foreign_key_field: config.foreign_key_field,
    foreign_key_value: parent_entity.id,
    holder_type_field: config.holder_type_field,
    holder_type_value: config.holder_type_value,
  };
}

export function get_sorted_fields_for_display(
  fields: FieldMetadata[],
  in_edit_mode: boolean,
): FieldMetadata[] {
  const renderable_fields = fields.filter(
    (f) => f.field_type !== DYNAMIC_FORM_FIELD_TYPE.SUB_ENTITY,
  );
  const visible_fields = renderable_fields.filter(
    (f) => !(!in_edit_mode && f.hide_on_create),
  );
  const file_fields = visible_fields.filter(
    (f) => f.field_type === DYNAMIC_FORM_FIELD_TYPE.FILE,
  );
  const other_fields = visible_fields.filter(
    (f) => f.field_type !== DYNAMIC_FORM_FIELD_TYPE.FILE,
  );
  return [...file_fields, ...other_fields];
}

export function initialize_form_data_from_metadata(
  metadata: EntityMetadata,
  existing_data?: Partial<BaseEntity>,
): DynamicFormData {
  const existing_values: DynamicFormData = { ...existing_data };
  const new_form_data: DynamicFormData = {};
  for (const field of metadata.fields) {
    new_form_data[field.field_name] = Object.prototype.hasOwnProperty.call(
      existing_values,
      field.field_name,
    )
      ? existing_values[field.field_name]
      : get_default_value_for_field_type(field);
  }
  return new_form_data;
}

export function is_field_visible_by_visible_when_condition(
  field: FieldMetadata,
  current_form_data: DynamicFormData,
): boolean {
  if (!field.visible_when) return true;
  const dependency_value =
    current_form_data[field.visible_when.depends_on_field];
  if (!is_string_value(dependency_value) || !dependency_value) return false;
  return field.visible_when.visible_when_values.includes(dependency_value);
}

export function is_field_controlled_by_sub_entity_filter(
  field_name: string,
  filter?: SubEntityFilter,
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
  sub_entity_filter?: SubEntityFilter,
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

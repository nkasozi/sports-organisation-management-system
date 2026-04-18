import type {
  EntityMetadata,
  FieldMetadata,
} from "../../core/entities/BaseEntity";
import type { SubEntityFilter } from "../../core/types/SubEntityFilter";
import {
  build_dynamic_form_stage_template_defaults,
  is_competition_format_entity_type,
} from "./dynamicEntityFormInitialization";
import {
  find_dependent_enum_fields as find_dependent_enum_fields_from_logic,
  format_enum_label,
  is_field_controlled_by_sub_entity_filter,
  is_field_visible_by_visible_when_condition,
} from "./dynamicFormLogic";
import {
  filter_enum_values_by_creator_role,
  type UserRoleState,
} from "./systemUserFormLogic";

export function get_dynamic_form_sorted_fields_for_display(
  fields: FieldMetadata[],
  in_edit_mode: boolean,
  current_form_data: Record<string, any>,
  sub_entity_filter?: SubEntityFilter,
): FieldMetadata[] {
  const renderable_fields = fields.filter(
    (field) => field.field_type !== "sub_entity",
  );
  const visible_fields = renderable_fields.filter((field) => {
    if (!in_edit_mode && field.hide_on_create) return false;
    if (in_edit_mode && field.hide_on_edit) return false;
    if (
      is_field_controlled_by_sub_entity_filter(
        field.field_name,
        sub_entity_filter,
      )
    ) {
      return false;
    }
    return is_field_visible_by_visible_when_condition(field, current_form_data);
  });
  const file_fields = visible_fields.filter(
    (field) => field.field_type === "file",
  );
  const other_fields = visible_fields.filter(
    (field) => field.field_type !== "file",
  );
  return [...file_fields, ...other_fields];
}

export function update_dynamic_form_field_value(
  entity_metadata: EntityMetadata | undefined,
  current_form_data: Record<string, any>,
  entity_type: string,
  field_name: string,
  value: unknown,
): Record<string, any> {
  let updated_form_data = {
    ...current_form_data,
    [field_name]: value,
  };

  if (
    is_competition_format_entity_type(entity_type) &&
    field_name === "format_type"
  ) {
    updated_form_data = {
      ...updated_form_data,
      stage_templates: build_dynamic_form_stage_template_defaults({
        ...updated_form_data,
        format_type: value,
      }),
    };
  }

  updated_form_data = clear_dependent_enum_values(
    entity_metadata,
    updated_form_data,
    field_name,
  );
  return clear_fields_hidden_by_visible_when(
    entity_metadata,
    updated_form_data,
    field_name,
  );
}

export function build_dynamic_form_enum_select_options(
  field: FieldMetadata,
  form_data: Record<string, any>,
  entity_type: string,
  current_auth_role_state: UserRoleState,
): { value: string; label: string }[] {
  if (field.enum_dependency) {
    const dependency_value = form_data[field.enum_dependency.depends_on_field];
    if (!dependency_value) return [];
    return field.enum_dependency.options_map[dependency_value] || [];
  }

  if (field.enum_options) {
    return field.enum_options;
  }

  if (!field.enum_values) {
    return [];
  }

  const normalized_entity_type = entity_type
    .toLowerCase()
    .replace(/[\s_-]/g, "");
  const filtered_values =
    normalized_entity_type === "systemuser" && field.field_name === "role"
      ? filter_enum_values_by_creator_role(
          field.field_name,
          field.enum_values,
          current_auth_role_state,
        )
      : field.enum_values;

  return filtered_values.map((option) => ({
    value: option,
    label: format_enum_label(option),
  }));
}

function clear_dependent_enum_values(
  entity_metadata: EntityMetadata | undefined,
  current_form_data: Record<string, any>,
  parent_field_name: string,
): Record<string, any> {
  if (!entity_metadata) return current_form_data;
  const dependent_fields = find_dependent_enum_fields_from_logic(
    entity_metadata,
    parent_field_name,
  );
  if (dependent_fields.length === 0) return current_form_data;

  const updated_form_data = { ...current_form_data };
  for (const field of dependent_fields) {
    updated_form_data[field.field_name] = "";
  }
  return updated_form_data;
}

function clear_fields_hidden_by_visible_when(
  entity_metadata: EntityMetadata | undefined,
  current_form_data: Record<string, any>,
  changed_field_name: string,
): Record<string, any> {
  if (!entity_metadata) return current_form_data;

  const updated_form_data = { ...current_form_data };
  for (const field of entity_metadata.fields) {
    if (!field.visible_when) continue;
    if (field.visible_when.depends_on_field !== changed_field_name) continue;

    const dependency_value = updated_form_data[changed_field_name];
    const is_still_visible =
      dependency_value &&
      field.visible_when.visible_when_values.includes(dependency_value);

    if (!is_still_visible) {
      updated_form_data[field.field_name] = "";
    }
  }

  return updated_form_data;
}

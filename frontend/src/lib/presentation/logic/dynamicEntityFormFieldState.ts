import type {
  EntityMetadata,
  EnumDependencyConfig,
  FieldMetadata,
} from "../../core/entities/BaseEntity";
import type { SubEntityFilter } from "../../core/types/SubEntityFilter";
import {
  build_dynamic_form_stage_template_defaults,
  is_competition_format_entity_type,
} from "./dynamicEntityFormInitialization";
import {
  DYNAMIC_FORM_ENTITY_TYPE,
  DYNAMIC_FORM_FIELD_NAME,
  DYNAMIC_FORM_FIELD_TYPE,
  type DynamicFormData,
  is_dynamic_form_entity_type,
} from "./dynamicFormConstants";
import {
  find_dependent_enum_fields as find_dependent_enum_fields_from_logic,
  format_enum_label,
  is_field_controlled_by_sub_entity_filter,
  is_field_visible_by_visible_when_condition,
} from "./dynamicFormLogic";
import { is_string_value } from "./runtimeTypeGuards";
import {
  filter_enum_values_by_creator_role,
  type UserRoleState,
} from "./systemUserFormLogic";

export function get_dynamic_form_sorted_fields_for_display(
  fields: FieldMetadata[],
  in_edit_mode: boolean,
  current_form_data: DynamicFormData,
  sub_entity_filter?: SubEntityFilter,
): FieldMetadata[] {
  const renderable_fields = fields.filter(
    (field) => field.field_type !== DYNAMIC_FORM_FIELD_TYPE.SUB_ENTITY,
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
    (field) => field.field_type === DYNAMIC_FORM_FIELD_TYPE.FILE,
  );
  const other_fields = visible_fields.filter(
    (field) => field.field_type !== DYNAMIC_FORM_FIELD_TYPE.FILE,
  );
  return [...file_fields, ...other_fields];
}

export function update_dynamic_form_field_value(
  entity_metadata: EntityMetadata | undefined,
  current_form_data: DynamicFormData,
  entity_type: string,
  field_name: string,
  value: unknown,
): DynamicFormData {
  let updated_form_data = {
    ...current_form_data,
    [field_name]: value,
  };

  if (
    is_competition_format_entity_type(entity_type) &&
    field_name === DYNAMIC_FORM_FIELD_NAME.FORMAT_TYPE
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

function get_dependent_enum_options(
  enum_dependency: EnumDependencyConfig,
  form_data: DynamicFormData,
): { value: string; label: string }[] {
  const dependency_value = form_data[enum_dependency.depends_on_field];
  if (!is_string_value(dependency_value) || !dependency_value) return [];
  return enum_dependency.options_map[dependency_value] || [];
}

export function build_dynamic_form_enum_select_options(
  field: FieldMetadata,
  form_data: DynamicFormData,
  entity_type: string,
  current_auth_role_state: UserRoleState,
): { value: string; label: string }[] {
  if (field.enum_dependency) {
    return get_dependent_enum_options(field.enum_dependency, form_data);
  }

  if (field.enum_options) {
    return field.enum_options;
  }

  if (!field.enum_values) {
    return [];
  }

  const filtered_values =
    is_dynamic_form_entity_type(
      entity_type,
      DYNAMIC_FORM_ENTITY_TYPE.SYSTEM_USER,
    ) && field.field_name === DYNAMIC_FORM_FIELD_NAME.ROLE
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
  current_form_data: DynamicFormData,
  parent_field_name: string,
): DynamicFormData {
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
  current_form_data: DynamicFormData,
  changed_field_name: string,
): DynamicFormData {
  if (!entity_metadata) return current_form_data;

  const updated_form_data = { ...current_form_data };
  for (const field of entity_metadata.fields) {
    if (!field.visible_when) continue;
    if (field.visible_when.depends_on_field !== changed_field_name) continue;

    const dependency_value = updated_form_data[changed_field_name];
    const is_still_visible =
      is_string_value(dependency_value) &&
      field.visible_when.visible_when_values.includes(dependency_value);

    if (!is_still_visible) {
      updated_form_data[field.field_name] = "";
    }
  }

  return updated_form_data;
}

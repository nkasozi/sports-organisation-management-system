import {
  type DynamicFormFieldCallbackDependencies,
  handle_dynamic_form_file_change,
  handle_dynamic_form_official_assignments_change,
  set_dynamic_form_managed_value,
  set_dynamic_form_scalar_value,
} from "./dynamicEntityFormFieldValueHandlers";
import { handle_dynamic_form_foreign_key_change } from "./dynamicEntityFormForeignKeyChange";
import type { DynamicFormFieldCallbacks } from "./dynamicFormComponentTypes";

export function create_dynamic_form_field_callbacks(
  dependencies: DynamicFormFieldCallbackDependencies,
): DynamicFormFieldCallbacks {
  return {
    set_scalar_value: (field_name: string, value: unknown): boolean =>
      set_dynamic_form_scalar_value(dependencies, field_name, value),
    set_managed_value: (field_name: string, value: unknown): boolean =>
      set_dynamic_form_managed_value(dependencies, field_name, value),
    handle_foreign_key_change: (
      field_name: string,
      value: string,
    ): Promise<void> =>
      handle_dynamic_form_foreign_key_change(dependencies, field_name, value),
    handle_file_change: (event: Event, field_name: string): Promise<void> =>
      handle_dynamic_form_file_change(dependencies, event, field_name),
    handle_official_assignments_change: (
      field_name: string,
      assignments: unknown,
    ): Promise<void> =>
      handle_dynamic_form_official_assignments_change(
        dependencies,
        field_name,
        assignments,
      ),
    navigate_to_foreign_entity: dependencies.navigate_to_foreign_entity,
  };
}

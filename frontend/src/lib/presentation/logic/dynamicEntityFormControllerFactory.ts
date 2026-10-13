import {
  cancel_dynamic_entity_form,
  type DynamicEntityFormControllerDependencies,
  generate_dynamic_entity_form_fake_data,
  initialize_dynamic_entity_form_options,
  submit_dynamic_entity_form_controller,
} from "./dynamicEntityFormControllerActions";
import { create_dynamic_form_field_callbacks } from "./dynamicEntityFormFieldCallbacks";
import { navigate_to_dynamic_form_foreign_entity } from "./dynamicEntityFormLocalActions";
import type { DynamicFormFieldCallbacks } from "./dynamicFormComponentTypes";
import type { DynamicFormData } from "./dynamicFormConstants";

type DynamicEntityFormController = {
  callbacks: DynamicFormFieldCallbacks;
  initialize_options: (form_data: DynamicFormData) => Promise<void>;
  handle_submit: () => Promise<void>;
  handle_cancel: () => void;
  handle_generate_fake_data: () => void;
};

export function create_dynamic_entity_form_controller(
  dependencies: DynamicEntityFormControllerDependencies,
): DynamicEntityFormController {
  const callbacks = create_dynamic_form_field_callbacks({
    entity_type: dependencies.entity_type,
    get_entity_metadata: dependencies.get_entity_metadata,
    get_form_state: dependencies.get_form_state,
    set_form_state: dependencies.set_form_state,
    get_warning_state: dependencies.get_warning_state,
    set_warning_state: dependencies.set_warning_state,
    navigate_to_foreign_entity: navigate_to_dynamic_form_foreign_entity,
    conflict_dependencies: dependencies.conflict_dependencies,
    gender_dependencies: dependencies.gender_dependencies,
  });
  return {
    callbacks,
    initialize_options: (form_data: DynamicFormData): Promise<void> =>
      initialize_dynamic_entity_form_options(dependencies, form_data),
    handle_submit: (): Promise<void> =>
      submit_dynamic_entity_form_controller(dependencies),
    handle_cancel: (): void => cancel_dynamic_entity_form(dependencies),
    handle_generate_fake_data: (): void =>
      generate_dynamic_entity_form_fake_data(dependencies),
  };
}

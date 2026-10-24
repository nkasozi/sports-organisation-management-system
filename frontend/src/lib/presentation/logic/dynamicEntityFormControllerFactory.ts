import type { FieldMetadata } from "../../core/entities/BaseEntity";
import { fakeDataGenerator } from "../../infrastructure/utils/FakeDataGenerator";
import {
  cancel_dynamic_entity_form,
  type DynamicEntityFormControllerDependencies,
  generate_dynamic_entity_form_fake_data,
  initialize_dynamic_entity_form_options,
  submit_dynamic_entity_form_controller,
} from "./dynamicEntityFormControllerActions";
import { fill_required_foreign_keys } from "./dynamicEntityFormFakeDataForeignKeys";
import { refine_fake_data_after_choices } from "./dynamicEntityFormFakeDataRefinements";
import { create_dynamic_form_field_callbacks } from "./dynamicEntityFormFieldCallbacks";
import { navigate_to_dynamic_form_foreign_entity } from "./dynamicEntityFormLocalActions";
import type { DynamicFormFieldCallbacks } from "./dynamicFormComponentTypes";
import type { DynamicFormData } from "./dynamicFormConstants";

type DynamicEntityFormController = {
  callbacks: DynamicFormFieldCallbacks;
  initialize_options: (form_data: DynamicFormData) => Promise<void>;
  handle_submit: () => Promise<void>;
  handle_cancel: () => void;
  handle_generate_fake_data: () => Promise<void>;
};

async function generate_fake_data_with_choices(
  dependencies: DynamicEntityFormControllerDependencies,
  callbacks: DynamicFormFieldCallbacks,
): Promise<void> {
  generate_dynamic_entity_form_fake_data(dependencies);
  const metadata = dependencies.get_entity_metadata();
  if (!metadata || dependencies.get_is_edit_mode()) return;
  await fill_required_foreign_keys({
    fields: metadata.fields,
    get_form_state: dependencies.get_form_state,
    locked_field_names: dependencies.get_locked_field_names(),
    change_foreign_key: callbacks.handle_foreign_key_change,
  });
  apply_fake_data_refinements(dependencies, metadata.fields);
}

function apply_fake_data_refinements(
  dependencies: DynamicEntityFormControllerDependencies,
  fields: FieldMetadata[],
): boolean {
  const form_state = dependencies.get_form_state();
  dependencies.set_form_state({
    ...form_state,
    form_data: refine_fake_data_after_choices({
      entity_type: dependencies.entity_type,
      fields,
      form_state,
      locked_field_names: dependencies.get_locked_field_names(),
      today: new Date(),
      generate_fake_data: (generate_fields, entity_type, hints) =>
        fakeDataGenerator.generate_fake_data_for_entity_fields(
          generate_fields,
          entity_type,
          hints,
        ),
    }),
  });
  return true;
}

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
    handle_generate_fake_data: (): Promise<void> =>
      generate_fake_data_with_choices(dependencies, callbacks),
  };
}

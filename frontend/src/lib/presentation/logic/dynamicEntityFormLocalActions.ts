import { goto } from "$app/navigation";

import type { EntityMetadata } from "../../core/entities/BaseEntity";
import { fakeDataGenerator } from "../../infrastructure/utils/FakeDataGenerator";
import type { DynamicEntityFormState } from "./dynamicEntityFormState";
import { build_foreign_entity_route } from "./dynamicFormLogic";

export function build_dynamic_form_fake_data_state(
  entity_metadata: EntityMetadata | null,
  is_edit_mode: boolean,
  form_state: DynamicEntityFormState,
): DynamicEntityFormState {
  if (!entity_metadata || is_edit_mode) return form_state;
  const fake_data_result =
    fakeDataGenerator.generate_fake_data_for_entity_fields(
      entity_metadata.fields,
    );
  if (!fake_data_result.success) return form_state;
  return {
    ...form_state,
    form_data: {
      ...form_state.form_data,
      ...fake_data_result.generated_data,
    },
    validation_errors: {},
  };
}

export function navigate_to_dynamic_form_foreign_entity(
  foreign_entity_type: string | undefined,
): boolean {
  const route = build_foreign_entity_route(foreign_entity_type);
  if (!route) return false;
  goto(route);
  return true;
}

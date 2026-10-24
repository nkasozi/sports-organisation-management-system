import { goto } from "$app/navigation";

import type { EntityMetadata } from "../../core/entities/BaseEntity";
import { fakeDataGenerator } from "../../infrastructure/utils/FakeDataGenerator";
import { choose_required_foreign_keys } from "./dynamicEntityFormFakeDataForeignKeys";
import { DYNAMIC_ENTITY_FORM_EVENT } from "./dynamicEntityFormMessages";
import type { DynamicEntityFormState } from "./dynamicEntityFormState";
import { build_foreign_entity_route } from "./dynamicFormLogic";

function omit_locked_fields(
  generated_data: Record<string, unknown>,
  locked_field_names: ReadonlySet<string>,
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(generated_data).filter(
      ([field_name]) => !locked_field_names.has(field_name),
    ),
  );
}

export function build_dynamic_form_fake_data_state(
  entity_metadata: EntityMetadata | undefined,
  is_edit_mode: boolean,
  form_state: DynamicEntityFormState,
  locked_field_names: ReadonlySet<string>,
): DynamicEntityFormState {
  if (
    !entity_metadata ||
    !Array.isArray((entity_metadata as Partial<EntityMetadata>).fields) ||
    is_edit_mode
  )
    return form_state;
  const fake_data_result =
    fakeDataGenerator.generate_fake_data_for_entity_fields(
      entity_metadata.fields,
      entity_metadata.entity_name,
    );
  if (!fake_data_result.success) return form_state;
  return {
    ...form_state,
    form_data: {
      ...form_state.form_data,
      ...omit_locked_fields(
        fake_data_result.generated_data,
        locked_field_names,
      ),
      ...choose_required_foreign_keys(
        entity_metadata.fields,
        form_state.form_data,
        form_state.foreign_key_options ?? {},
        locked_field_names,
      ),
    },
    validation_errors: {},
  };
}

async function go_to_foreign_entity_route(route: string): Promise<void> {
  try {
    await goto(route);
  } catch (error) {
    console.error("[DynamicEntityForm] Foreign entity navigation failed", {
      event: DYNAMIC_ENTITY_FORM_EVENT.FOREIGN_ENTITY_NAVIGATION_FAILED,
      route,
      error: String(error),
    });
  }
}

export function navigate_to_dynamic_form_foreign_entity(
  foreign_entity_type?: string,
): boolean {
  const route = build_foreign_entity_route(foreign_entity_type);
  if (!route) return false;
  void go_to_foreign_entity_route(route);
  return true;
}

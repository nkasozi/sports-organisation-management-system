import { validate_syncable_image_file } from "$lib/core/services/syncableImageFileValidation";

import type { EntityMetadata } from "../../core/entities/BaseEntity";
import { update_dynamic_form_field_value } from "./dynamicEntityFormFieldState";
import type { DynamicEntityFormGenderDependencies } from "./dynamicEntityFormGenderWarnings";
import {
  type DynamicEntityFormConflictDependencies,
  load_dynamic_form_official_conflict_warnings,
} from "./dynamicEntityFormOfficialConflictWarnings";
import type {
  DynamicEntityFormState,
  DynamicEntityFormWarningState,
} from "./dynamicEntityFormState";
import type { DynamicFormData } from "./dynamicFormConstants";
import { convert_file_to_base64 } from "./dynamicFormLogic";
import {
  DYNAMIC_FORM_EVENT,
  DYNAMIC_FORM_MESSAGE,
} from "./dynamicFormMessages";

export type DynamicFormFieldCallbackDependencies = {
  entity_type: string;
  get_entity_metadata: () => EntityMetadata | undefined;
  get_form_state: () => DynamicEntityFormState;
  set_form_state: (next_state: DynamicEntityFormState) => void;
  get_warning_state: () => DynamicEntityFormWarningState;
  set_warning_state: (next_state: DynamicEntityFormWarningState) => void;
  navigate_to_foreign_entity: (entity_type: string | undefined) => boolean;
  conflict_dependencies: DynamicEntityFormConflictDependencies;
  gender_dependencies: DynamicEntityFormGenderDependencies;
};

export function set_dynamic_form_scalar_value(
  dependencies: DynamicFormFieldCallbackDependencies,
  field_name: string,
  value: unknown,
): boolean {
  const form_state = dependencies.get_form_state();
  dependencies.set_form_state({
    ...form_state,
    form_data: { ...form_state.form_data, [field_name]: value },
  });
  return true;
}

export function compute_dynamic_form_managed_data(
  dependencies: DynamicFormFieldCallbackDependencies,
  form_data: DynamicFormData,
  field_name: string,
  value: unknown,
): DynamicFormData {
  return update_dynamic_form_field_value(
    dependencies.get_entity_metadata(),
    form_data,
    dependencies.entity_type,
    field_name,
    value,
  );
}

export function set_dynamic_form_managed_value(
  dependencies: DynamicFormFieldCallbackDependencies,
  field_name: string,
  value: unknown,
): boolean {
  const form_state = dependencies.get_form_state();
  dependencies.set_form_state({
    ...form_state,
    form_data: compute_dynamic_form_managed_data(
      dependencies,
      form_state.form_data,
      field_name,
      value,
    ),
  });
  return true;
}

function set_dynamic_form_field_error(
  dependencies: DynamicFormFieldCallbackDependencies,
  form_state: DynamicEntityFormState,
  field_name: string,
  error_message: string,
): void {
  dependencies.set_form_state({
    ...form_state,
    validation_errors: {
      ...form_state.validation_errors,
      [field_name]: error_message,
    },
  });
}

async function store_dynamic_form_file_value(
  dependencies: DynamicFormFieldCallbackDependencies,
  form_state: DynamicEntityFormState,
  field_name: string,
  file: File,
): Promise<void> {
  const encoding_result = await convert_file_to_base64(file);
  if (!encoding_result.success) {
    console.error("[DynamicForm] Failed to store file value", {
      event: DYNAMIC_FORM_EVENT.FILE_STORE_FAILED,
      entity_type: dependencies.entity_type,
      field_name,
      error: encoding_result.error,
    });
    set_dynamic_form_field_error(
      dependencies,
      form_state,
      field_name,
      DYNAMIC_FORM_MESSAGE.FILE_PROCESSING_FAILED,
    );
    return;
  }
  const validation_errors = { ...form_state.validation_errors };
  delete validation_errors[field_name];
  dependencies.set_form_state({
    ...form_state,
    form_data: { ...form_state.form_data, [field_name]: encoding_result.data },
    validation_errors,
  });
}

export async function handle_dynamic_form_file_change(
  dependencies: DynamicFormFieldCallbackDependencies,
  event: Event,
  field_name: string,
): Promise<void> {
  const form_state = dependencies.get_form_state();
  const input = event.target as HTMLInputElement;
  if (!input.files || input.files.length === 0) return;
  const file = input.files[0];
  const file_validation = validate_syncable_image_file(file);
  if (!file_validation.is_valid) {
    set_dynamic_form_field_error(
      dependencies,
      form_state,
      field_name,
      file_validation.error_message ??
        DYNAMIC_FORM_MESSAGE.FILE_VALIDATION_FAILED,
    );
    return;
  }
  await store_dynamic_form_file_value(
    dependencies,
    form_state,
    field_name,
    file,
  );
}

export async function handle_dynamic_form_official_assignments_change(
  dependencies: DynamicFormFieldCallbackDependencies,
  field_name: string,
  assignments: unknown,
): Promise<void> {
  const form_state = dependencies.get_form_state();
  const form_data = compute_dynamic_form_managed_data(
    dependencies,
    form_state.form_data,
    field_name,
    assignments,
  );
  dependencies.set_form_state({ ...form_state, form_data });
  const warning_state = dependencies.get_warning_state();
  dependencies.set_warning_state({
    ...warning_state,
    official_team_conflict_warnings:
      await load_dynamic_form_official_conflict_warnings(
        dependencies.entity_type,
        form_data,
        dependencies.conflict_dependencies,
      ),
  });
}

import type { PlayerTeamMembershipUseCasesPort } from "$lib/core/interfaces/ports/internal/usecases/PlayerTeamMembershipUseCasesPort";
import type { EntityCrudHandlers } from "$lib/core/types/EntityHandlers";

import type {
  BaseEntity,
  EntityMetadata,
} from "../../core/entities/BaseEntity";
import { DYNAMIC_ENTITY_FORM_SUBMIT_STATUS } from "./dynamicEntityFormConstants";
import type { DynamicEntityFormGenderDependencies } from "./dynamicEntityFormGenderWarnings";
import { load_dynamic_form_initial_state } from "./dynamicEntityFormInitialLoad";
import { build_dynamic_form_fake_data_state } from "./dynamicEntityFormLocalActions";
import type { DynamicEntityFormConflictDependencies } from "./dynamicEntityFormOfficialConflictWarnings";
import type {
  DynamicEntityFormState,
  DynamicEntityFormUiState,
  DynamicEntityFormWarningState,
} from "./dynamicEntityFormState";
import {
  type DynamicEntityFormSubmitResult,
  submit_dynamic_entity_form,
} from "./dynamicEntityFormSubmitFlow";
import type { DynamicFormData } from "./dynamicFormConstants";

const NO_SAVE_ERROR_MESSAGE = "";

export type DynamicEntityFormControllerDependencies = {
  entity_type: string;
  crud_handlers?: EntityCrudHandlers;
  is_inline_mode: boolean;
  player_team_membership_use_cases: PlayerTeamMembershipUseCasesPort;
  get_entity_metadata: () => EntityMetadata | undefined;
  get_locked_field_names: () => ReadonlySet<string>;
  get_is_edit_mode: () => boolean;
  get_entity_data: () => Partial<BaseEntity> | undefined;
  get_form_state: () => DynamicEntityFormState;
  set_form_state: (next_state: DynamicEntityFormState) => void;
  get_ui_state: () => DynamicEntityFormUiState;
  set_ui_state: (next_state: DynamicEntityFormUiState) => void;
  get_warning_state: () => DynamicEntityFormWarningState;
  set_warning_state: (next_state: DynamicEntityFormWarningState) => void;
  on_inline_save_success: (entity: BaseEntity) => void;
  on_save_completed: (entity: BaseEntity, was_new_entity: boolean) => void;
  on_inline_cancel: () => void;
  on_cancel: () => void;
  conflict_dependencies: DynamicEntityFormConflictDependencies;
  gender_dependencies: DynamicEntityFormGenderDependencies;
};

export async function initialize_dynamic_entity_form_options(
  dependencies: DynamicEntityFormControllerDependencies,
  form_data: DynamicFormData,
): Promise<void> {
  const entity_metadata = dependencies.get_entity_metadata();
  if (!entity_metadata) return;
  dependencies.set_ui_state({
    ...dependencies.get_ui_state(),
    is_loading: true,
  });
  const initial_state = await load_dynamic_form_initial_state(
    entity_metadata,
    form_data,
    dependencies.entity_type,
    dependencies.conflict_dependencies,
  );
  dependencies.set_form_state({
    ...dependencies.get_form_state(),
    ...initial_state.form_state,
    validation_errors: {},
    filtered_fields_loading: {},
  });
  dependencies.set_warning_state({
    ...dependencies.get_warning_state(),
    ...initial_state.warning_state,
  });
  dependencies.set_ui_state({
    ...dependencies.get_ui_state(),
    is_loading: false,
  });
}

export async function submit_dynamic_entity_form_controller(
  dependencies: DynamicEntityFormControllerDependencies,
): Promise<void> {
  const ui_state = dependencies.get_ui_state();
  const form_state = dependencies.get_form_state();
  dependencies.set_ui_state({
    ...ui_state,
    is_save_in_progress: true,
    save_error_message: NO_SAVE_ERROR_MESSAGE,
  });
  dependencies.set_form_state({ ...form_state, validation_errors: {} });
  const submit_result = await submit_dynamic_entity_form({
    entity_type: dependencies.entity_type,
    entity_metadata: dependencies.get_entity_metadata(),
    form_data: dependencies.get_form_state().form_data,
    is_edit_mode: dependencies.get_is_edit_mode(),
    entity_data: dependencies.get_entity_data(),
    crud_handlers: dependencies.crud_handlers,
    permission_denied: ui_state.permission_denied,
    player_team_membership_use_cases:
      dependencies.player_team_membership_use_cases,
  });
  apply_submit_result(dependencies, submit_result);
}

export function cancel_dynamic_entity_form(
  dependencies: DynamicEntityFormControllerDependencies,
): void {
  if (dependencies.is_inline_mode) {
    dependencies.on_inline_cancel();
    return;
  }
  dependencies.on_cancel();
}

export function generate_dynamic_entity_form_fake_data(
  dependencies: DynamicEntityFormControllerDependencies,
): void {
  dependencies.set_form_state(
    build_dynamic_form_fake_data_state(
      dependencies.get_entity_metadata(),
      dependencies.get_is_edit_mode(),
      dependencies.get_form_state(),
      dependencies.get_locked_field_names(),
    ),
  );
}

function complete_dynamic_form_save(
  dependencies: DynamicEntityFormControllerDependencies,
  saved_entity: BaseEntity,
): void {
  if (dependencies.is_inline_mode) {
    dependencies.on_inline_save_success(saved_entity);
    return;
  }
  dependencies.on_save_completed(
    saved_entity,
    !dependencies.get_is_edit_mode(),
  );
}

function finish_dynamic_form_save_attempt(
  dependencies: DynamicEntityFormControllerDependencies,
  save_error_message: string,
): void {
  dependencies.set_ui_state({
    ...dependencies.get_ui_state(),
    is_save_in_progress: false,
    save_error_message,
  });
}

function apply_submit_result(
  dependencies: DynamicEntityFormControllerDependencies,
  submit_result: DynamicEntityFormSubmitResult,
): void {
  switch (submit_result.status) {
    case DYNAMIC_ENTITY_FORM_SUBMIT_STATUS.SKIPPED:
      finish_dynamic_form_save_attempt(dependencies, NO_SAVE_ERROR_MESSAGE);
      return;
    case DYNAMIC_ENTITY_FORM_SUBMIT_STATUS.INVALID:
      finish_dynamic_form_save_attempt(dependencies, NO_SAVE_ERROR_MESSAGE);
      dependencies.set_form_state({
        ...dependencies.get_form_state(),
        validation_errors: submit_result.validation_errors,
      });
      return;
    case DYNAMIC_ENTITY_FORM_SUBMIT_STATUS.FAILED:
      finish_dynamic_form_save_attempt(
        dependencies,
        submit_result.save_error_message,
      );
      return;
    case DYNAMIC_ENTITY_FORM_SUBMIT_STATUS.SAVED:
      finish_dynamic_form_save_attempt(dependencies, NO_SAVE_ERROR_MESSAGE);
      complete_dynamic_form_save(dependencies, submit_result.saved_entity);
      return;
  }
}

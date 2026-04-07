import type { PlayerTeamMembershipUseCasesPort } from "$lib/core/interfaces/ports/internal/usecases/PlayerTeamMembershipUseCasesPort";
import type { EntityCrudHandlers } from "$lib/core/types/EntityHandlers";

import type {
  BaseEntity,
  EntityMetadata,
} from "../../core/entities/BaseEntity";
import { create_dynamic_form_field_callbacks } from "./dynamicEntityFormFieldCallbacks";
import type { DynamicEntityFormGenderDependencies } from "./dynamicEntityFormGenderWarnings";
import { load_dynamic_form_initial_state } from "./dynamicEntityFormInitialLoad";
import {
  build_dynamic_form_fake_data_state,
  navigate_to_dynamic_form_foreign_entity,
} from "./dynamicEntityFormLocalActions";
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
import type { DynamicFormFieldCallbacks } from "./dynamicFormComponentTypes";

type ControllerDependencies = {
  entity_type: string;
  crud_handlers: EntityCrudHandlers | null;
  is_inline_mode: boolean;
  player_team_membership_use_cases: PlayerTeamMembershipUseCasesPort;
  get_entity_metadata: () => EntityMetadata | null;
  get_is_edit_mode: () => boolean;
  get_entity_data: () => Partial<BaseEntity> | null;
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

export function create_dynamic_entity_form_controller(
  dependencies: ControllerDependencies,
): {
  callbacks: DynamicFormFieldCallbacks;
  initialize_options: (form_data: Record<string, any>) => Promise<void>;
  handle_submit: () => Promise<void>;
  handle_cancel: () => void;
  handle_generate_fake_data: () => void;
} {
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

  async function initialize_options(
    form_data: Record<string, any>,
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

  async function handle_submit(): Promise<void> {
    const ui_state = dependencies.get_ui_state();
    const form_state = dependencies.get_form_state();
    dependencies.set_ui_state({
      ...ui_state,
      is_save_in_progress: true,
      save_error_message: "",
    });
    dependencies.set_form_state({ ...form_state, validation_errors: {} });
    const submit_result = await submit_dynamic_entity_form(
      dependencies.entity_type,
      dependencies.get_entity_metadata(),
      dependencies.get_form_state().form_data,
      dependencies.get_is_edit_mode(),
      dependencies.get_entity_data(),
      dependencies.crud_handlers,
      ui_state.permission_denied,
      dependencies.player_team_membership_use_cases,
    );
    apply_submit_result(dependencies, submit_result);
  }

  function handle_cancel(): void {
    if (dependencies.is_inline_mode) {
      dependencies.on_inline_cancel();
      return;
    }
    dependencies.on_cancel();
  }

  function handle_generate_fake_data(): void {
    dependencies.set_form_state(
      build_dynamic_form_fake_data_state(
        dependencies.get_entity_metadata(),
        dependencies.get_is_edit_mode(),
        dependencies.get_form_state(),
      ),
    );
  }

  return {
    callbacks,
    initialize_options,
    handle_submit,
    handle_cancel,
    handle_generate_fake_data,
  };
}

function apply_submit_result(
  dependencies: ControllerDependencies,
  submit_result: DynamicEntityFormSubmitResult,
): void {
  dependencies.set_ui_state({
    ...dependencies.get_ui_state(),
    is_save_in_progress: false,
    save_error_message: submit_result.save_error_message,
  });
  if (Object.keys(submit_result.validation_errors).length > 0) {
    dependencies.set_form_state({
      ...dependencies.get_form_state(),
      validation_errors: submit_result.validation_errors,
    });
    return;
  }
  if (!submit_result.saved_entity) return;
  if (dependencies.is_inline_mode) {
    dependencies.on_inline_save_success(submit_result.saved_entity);
    return;
  }
  dependencies.on_save_completed(
    submit_result.saved_entity,
    !dependencies.get_is_edit_mode(),
  );
}

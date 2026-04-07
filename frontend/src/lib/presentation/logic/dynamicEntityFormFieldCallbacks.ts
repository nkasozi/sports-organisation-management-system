import type { EntityMetadata } from "../../core/entities/BaseEntity";
import { build_dynamic_form_jersey_color_warnings } from "./dynamicEntityFormConflictWarnings";
import { handle_dynamic_form_dependency_change } from "./dynamicEntityFormDependencyHandling";
import { update_dynamic_form_field_value } from "./dynamicEntityFormFieldState";
import {
  type DynamicEntityFormGenderDependencies,
  load_dynamic_form_fixture_gender_warnings,
  load_dynamic_form_player_gender_warnings,
} from "./dynamicEntityFormGenderWarnings";
import {
  type DynamicEntityFormConflictDependencies,
  load_dynamic_form_official_conflict_warnings,
} from "./dynamicEntityFormOfficialConflictWarnings";
import type {
  DynamicEntityFormState,
  DynamicEntityFormWarningState,
} from "./dynamicEntityFormState";
import type { DynamicFormFieldCallbacks } from "./dynamicFormComponentTypes";
import { convert_file_to_base64 } from "./dynamicFormLogic";

type CallbackDependencies = {
  entity_type: string;
  get_entity_metadata: () => EntityMetadata | null;
  get_form_state: () => DynamicEntityFormState;
  set_form_state: (next_state: DynamicEntityFormState) => void;
  get_warning_state: () => DynamicEntityFormWarningState;
  set_warning_state: (next_state: DynamicEntityFormWarningState) => void;
  navigate_to_foreign_entity: (entity_type: string | undefined) => boolean;
  conflict_dependencies: DynamicEntityFormConflictDependencies;
  gender_dependencies: DynamicEntityFormGenderDependencies;
};

export function create_dynamic_form_field_callbacks(
  dependencies: CallbackDependencies,
): DynamicFormFieldCallbacks {
  const set_scalar_value = (field_name: string, value: unknown): boolean => {
    const form_state = dependencies.get_form_state();
    dependencies.set_form_state({
      ...form_state,
      form_data: { ...form_state.form_data, [field_name]: value },
    });
    return true;
  };

  const set_managed_value = (field_name: string, value: unknown): boolean => {
    const form_state = dependencies.get_form_state();
    dependencies.set_form_state({
      ...form_state,
      form_data: update_dynamic_form_field_value(
        dependencies.get_entity_metadata(),
        form_state.form_data,
        dependencies.entity_type,
        field_name,
        value,
      ),
    });
    return true;
  };

  const handle_file_change = async (
    event: Event,
    field_name: string,
  ): Promise<void> => {
    const form_state = dependencies.get_form_state();
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    if (!file.type.startsWith("image/")) {
      dependencies.set_form_state({
        ...form_state,
        validation_errors: {
          ...form_state.validation_errors,
          [field_name]: "Please select an image file",
        },
      });
      return;
    }
    try {
      const base64 = await convert_file_to_base64(file);
      const validation_errors = { ...form_state.validation_errors };
      delete validation_errors[field_name];
      dependencies.set_form_state({
        ...form_state,
        form_data: { ...form_state.form_data, [field_name]: base64 },
        validation_errors,
      });
    } catch (error) {
      dependencies.set_form_state({
        ...form_state,
        validation_errors: {
          ...form_state.validation_errors,
          [field_name]: `Failed to process file: ${error}`,
        },
      });
    }
  };

  const handle_foreign_key_change = async (
    field_name: string,
    value: string,
  ): Promise<void> => {
    const form_state = dependencies.get_form_state();
    const next_form_data = update_dynamic_form_field_value(
      dependencies.get_entity_metadata(),
      form_state.form_data,
      dependencies.entity_type,
      field_name,
      value,
    );
    const dependency_result = await handle_dynamic_form_dependency_change({
      entity_type: dependencies.entity_type,
      entity_metadata: dependencies.get_entity_metadata(),
      changed_field_name: field_name,
      new_value: value,
      form_data: next_form_data,
      foreign_key_options: form_state.foreign_key_options,
      all_competition_teams_cache: form_state.all_competition_teams_cache,
    });
    dependencies.set_form_state({ ...form_state, ...dependency_result });
    const warning_state = dependencies.get_warning_state();
    dependencies.set_warning_state({
      ...warning_state,
      color_clash_warnings: dependency_result.should_check_jersey_color_clashes
        ? build_dynamic_form_jersey_color_warnings(
            dependencies.entity_type,
            dependency_result.form_data,
            dependency_result.foreign_key_options,
          )
        : warning_state.color_clash_warnings,
      official_team_conflict_warnings:
        await load_dynamic_form_official_conflict_warnings(
          dependencies.entity_type,
          dependency_result.form_data,
          dependencies.conflict_dependencies,
        ),
      gender_mismatch_warnings:
        dependency_result.should_run_gender_mismatch_check
          ? await load_dynamic_form_player_gender_warnings(
              dependencies.entity_type,
              dependency_result.form_data,
              dependencies.gender_dependencies,
            )
          : warning_state.gender_mismatch_warnings,
      fixture_team_gender_mismatch_warnings:
        dependency_result.should_run_fixture_team_gender_mismatch_check
          ? await load_dynamic_form_fixture_gender_warnings(
              dependency_result.form_data,
              dependencies.gender_dependencies,
            )
          : warning_state.fixture_team_gender_mismatch_warnings,
    });
  };

  const handle_official_assignments_change = async (
    field_name: string,
    assignments: unknown,
  ): Promise<void> => {
    const form_state = dependencies.get_form_state();
    const form_data = update_dynamic_form_field_value(
      dependencies.get_entity_metadata(),
      form_state.form_data,
      dependencies.entity_type,
      field_name,
      assignments,
    );
    dependencies.set_form_state({ ...form_state, form_data });
    dependencies.set_warning_state({
      ...dependencies.get_warning_state(),
      official_team_conflict_warnings:
        await load_dynamic_form_official_conflict_warnings(
          dependencies.entity_type,
          form_data,
          dependencies.conflict_dependencies,
        ),
    });
  };

  return {
    set_scalar_value,
    set_managed_value,
    handle_foreign_key_change,
    handle_file_change,
    handle_official_assignments_change,
    navigate_to_foreign_entity: dependencies.navigate_to_foreign_entity,
  };
}

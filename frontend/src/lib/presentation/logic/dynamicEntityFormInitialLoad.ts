import type {
  EntityMetadata,
  FieldMetadata,
} from "../../core/entities/BaseEntity";
import { build_dynamic_form_jersey_color_warnings } from "./dynamicEntityFormConflictWarnings";
import {
  type DynamicEntityFormConflictDependencies,
  load_dynamic_form_official_conflict_warnings,
} from "./dynamicEntityFormOfficialConflictWarnings";
import type {
  DynamicEntityFormState,
  DynamicEntityFormWarningState,
} from "./dynamicEntityFormState";
import {
  fetch_entities_for_type,
  fetch_filtered_entities_for_field,
  fetch_unfiltered_foreign_key_options,
} from "./dynamicFormDataLoader";

type InitialLoadState = Pick<
  DynamicEntityFormState,
  "form_data" | "foreign_key_options" | "all_competition_teams_cache"
>;

export async function load_dynamic_form_initial_state(
  metadata: EntityMetadata,
  form_data: Record<string, any>,
  entity_type: string,
  conflict_dependencies: DynamicEntityFormConflictDependencies,
): Promise<{
  form_state: InitialLoadState;
  warning_state: Pick<
    DynamicEntityFormWarningState,
    "color_clash_warnings" | "official_team_conflict_warnings"
  >;
}> {
  const foreign_key_options = await fetch_unfiltered_foreign_key_options(
    metadata.fields,
  );
  const initialized_form_state =
    await load_dynamic_form_initialized_filtered_options(metadata, form_data, {
      form_data,
      foreign_key_options,
      all_competition_teams_cache: [],
    });
  return {
    form_state: initialized_form_state,
    warning_state: {
      color_clash_warnings: build_dynamic_form_jersey_color_warnings(
        entity_type,
        initialized_form_state.form_data,
        initialized_form_state.foreign_key_options,
      ),
      official_team_conflict_warnings:
        await load_dynamic_form_official_conflict_warnings(
          entity_type,
          initialized_form_state.form_data,
          conflict_dependencies,
        ),
    },
  };
}

export async function load_dynamic_form_initialized_filtered_options(
  metadata: EntityMetadata,
  initialized_data: Record<string, unknown>,
  state: InitialLoadState,
): Promise<InitialLoadState> {
  let current_state = { ...state };
  for (const field of metadata.fields) {
    if (!field.foreign_key_filter) continue;
    const dependency_value =
      initialized_data[field.foreign_key_filter.depends_on_field];
    if (typeof dependency_value !== "string" || dependency_value.length === 0) {
      continue;
    }
    current_state = await resolve_filtered_field_options(
      field,
      dependency_value,
      current_state,
    );
  }
  return current_state;
}

async function resolve_filtered_field_options(
  field: FieldMetadata,
  dependency_value: string,
  state: InitialLoadState,
): Promise<InitialLoadState> {
  const result = await fetch_filtered_entities_for_field(
    field,
    dependency_value,
    state.foreign_key_options["player_id"] || [],
    state.form_data,
  );
  const foreign_key_options = {
    ...state.foreign_key_options,
    [field.field_name]: result.entities,
  };
  if (field.foreign_key_entity?.toLowerCase() === "fixture") {
    foreign_key_options["competition_id"] =
      await fetch_entities_for_type("competition");
  }
  return {
    form_data:
      result.auto_select_team_id && !state.form_data[field.field_name]
        ? { ...state.form_data, [field.field_name]: result.auto_select_team_id }
        : state.form_data,
    foreign_key_options,
    all_competition_teams_cache:
      result.all_competition_teams ?? state.all_competition_teams_cache,
  };
}

import type {
  BaseEntity,
  EntityMetadata,
  FieldMetadata,
} from "../../core/entities/BaseEntity";
import {
  compute_teams_after_exclusion,
  fetch_filtered_entities_for_field,
  fetch_venue_name_for_team,
} from "./dynamicFormDataLoader";

type DynamicFormDependencyState = {
  form_data: Record<string, any>;
  foreign_key_options: Record<string, BaseEntity[]>;
  all_competition_teams_cache: BaseEntity[];
};

type DynamicFormDependencyChangeResult = DynamicFormDependencyState & {
  should_check_jersey_color_clashes: boolean;
  should_run_gender_mismatch_check: boolean;
  should_run_fixture_team_gender_mismatch_check: boolean;
};

type DynamicFormDependencyChangeParams = DynamicFormDependencyState & {
  entity_type: string;
  entity_metadata: EntityMetadata | undefined;
  changed_field_name: string;
  new_value: string;
};

export async function handle_dynamic_form_dependency_change(
  params: DynamicFormDependencyChangeParams,
): Promise<DynamicFormDependencyChangeResult> {
  if (!params.entity_metadata) {
    return {
      ...params,
      should_check_jersey_color_clashes:
        params.changed_field_name.includes("jersey"),
      should_run_gender_mismatch_check: false,
      should_run_fixture_team_gender_mismatch_check: false,
    };
  }

  let current_state: DynamicFormDependencyState = {
    form_data: { ...params.form_data },
    foreign_key_options: { ...params.foreign_key_options },
    all_competition_teams_cache: [...params.all_competition_teams_cache],
  };

  for (const field of params.entity_metadata.fields) {
    if (
      field.foreign_key_filter?.depends_on_field !== params.changed_field_name
    ) {
      continue;
    }

    current_state = {
      ...current_state,
      form_data: {
        ...current_state.form_data,
        [field.field_name]: "",
      },
    };
    current_state = await resolve_filtered_field_options(
      field,
      params.new_value,
      current_state,
    );
  }

  current_state = {
    ...current_state,
    foreign_key_options: update_team_exclusion_options(
      params.entity_metadata,
      current_state.form_data,
      params.changed_field_name,
      current_state.all_competition_teams_cache,
      current_state.foreign_key_options,
    ),
  };

  if (
    params.changed_field_name === "home_team_id" &&
    params.entity_type.toLowerCase() === "fixture"
  ) {
    const venue_name = await fetch_venue_name_for_team(
      params.new_value,
      current_state.all_competition_teams_cache,
    );
    if (venue_name) {
      current_state = {
        ...current_state,
        form_data: {
          ...current_state.form_data,
          venue: venue_name,
        },
      };
    }
  }

  const normalized_entity_type = params.entity_type.toLowerCase();
  return {
    ...current_state,
    should_check_jersey_color_clashes:
      params.changed_field_name.includes("jersey"),
    should_run_gender_mismatch_check:
      (normalized_entity_type === "playerteammembership" ||
        normalized_entity_type === "playerteamtransferhistory") &&
      ["player_id", "team_id", "to_team_id"].includes(
        params.changed_field_name,
      ),
    should_run_fixture_team_gender_mismatch_check:
      normalized_entity_type === "fixture" &&
      ["home_team_id", "away_team_id"].includes(params.changed_field_name),
  };
}

async function resolve_filtered_field_options(
  field: FieldMetadata,
  dependency_value: string,
  state: DynamicFormDependencyState,
): Promise<DynamicFormDependencyState> {
  if (!field.foreign_key_filter || !dependency_value) {
    return {
      ...state,
      foreign_key_options: {
        ...state.foreign_key_options,
        [field.field_name]: [],
      },
    };
  }

  const result = await fetch_filtered_entities_for_field(
    field,
    dependency_value,
    state.foreign_key_options["player_id"] || [],
    state.form_data,
  );

  const updated_options: Record<string, BaseEntity[]> = {
    ...state.foreign_key_options,
    [field.field_name]: result.entities,
  };

  const updated_form_data =
    result.auto_select_team_id && !state.form_data[field.field_name]
      ? {
          ...state.form_data,
          [field.field_name]: result.auto_select_team_id,
        }
      : state.form_data;

  return {
    form_data: updated_form_data,
    foreign_key_options: updated_options,
    all_competition_teams_cache:
      result.all_competition_teams ?? state.all_competition_teams_cache,
  };
}

function update_team_exclusion_options(
  entity_metadata: EntityMetadata,
  form_data: Record<string, any>,
  changed_field_name: string,
  all_competition_teams_cache: BaseEntity[],
  current_options: Record<string, BaseEntity[]>,
): Record<string, BaseEntity[]> {
  if (all_competition_teams_cache.length === 0) {
    return current_options;
  }

  const updated_options = { ...current_options };
  for (const field of entity_metadata.fields) {
    if (
      field.foreign_key_filter?.filter_type !== "teams_from_competition" ||
      field.foreign_key_filter.exclude_field !== changed_field_name
    ) {
      continue;
    }

    const exclude_value_candidate = form_data[changed_field_name];
    const exclude_value =
      typeof exclude_value_candidate === "string"
        ? exclude_value_candidate
        : "";
    updated_options[field.field_name] = compute_teams_after_exclusion(
      all_competition_teams_cache,
      exclude_value,
    );
  }

  return updated_options;
}

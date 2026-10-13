import type { EntityMetadata } from "../../core/entities/BaseEntity";
import {
  build_dynamic_form_dependency_change_flags,
  type DynamicFormDependencyChangeFlags,
  type DynamicFormDependencyState,
  reload_dynamic_form_dependent_field_options,
  update_team_exclusion_options,
} from "./dynamicEntityFormDependencyOptions";
import {
  DYNAMIC_FORM_ENTITY_TYPE,
  DYNAMIC_FORM_FIELD_NAME,
  DYNAMIC_FORM_JERSEY_FIELD_HINT,
  is_dynamic_form_entity_type,
} from "./dynamicFormConstants";
import { fetch_venue_name_for_team } from "./dynamicFormDataLoader";

type DynamicFormDependencyChangeResult = DynamicFormDependencyState &
  DynamicFormDependencyChangeFlags;

type DynamicFormDependencyChangeParams = DynamicFormDependencyState & {
  entity_type: string;
  entity_metadata: EntityMetadata | undefined;
  changed_field_name: string;
  new_value: string;
};

async function hydrate_fixture_home_venue(
  params: DynamicFormDependencyChangeParams,
  state: DynamicFormDependencyState,
): Promise<DynamicFormDependencyState> {
  if (
    params.changed_field_name !== DYNAMIC_FORM_FIELD_NAME.HOME_TEAM_ID ||
    !is_dynamic_form_entity_type(
      params.entity_type,
      DYNAMIC_FORM_ENTITY_TYPE.FIXTURE,
    )
  )
    return state;
  const venue_name = await fetch_venue_name_for_team(
    params.new_value,
    state.all_competition_teams_cache,
  );
  if (!venue_name) return state;
  return {
    ...state,
    form_data: {
      ...state.form_data,
      [DYNAMIC_FORM_FIELD_NAME.VENUE]: venue_name,
    },
  };
}

async function apply_dynamic_form_dependency_updates(
  params: DynamicFormDependencyChangeParams,
  entity_metadata: EntityMetadata,
): Promise<DynamicFormDependencyState> {
  const reloaded_state = await reload_dynamic_form_dependent_field_options(
    entity_metadata,
    params.changed_field_name,
    params.new_value,
    {
      form_data: { ...params.form_data },
      foreign_key_options: { ...params.foreign_key_options },
      all_competition_teams_cache: [...params.all_competition_teams_cache],
    },
  );
  const excluded_state: DynamicFormDependencyState = {
    ...reloaded_state,
    foreign_key_options: update_team_exclusion_options(
      entity_metadata,
      reloaded_state.form_data,
      params.changed_field_name,
      reloaded_state.all_competition_teams_cache,
      reloaded_state.foreign_key_options,
    ),
  };
  return hydrate_fixture_home_venue(params, excluded_state);
}

export async function handle_dynamic_form_dependency_change(
  params: DynamicFormDependencyChangeParams,
): Promise<DynamicFormDependencyChangeResult> {
  if (!params.entity_metadata) {
    return {
      ...params,
      should_check_jersey_color_clashes: params.changed_field_name.includes(
        DYNAMIC_FORM_JERSEY_FIELD_HINT,
      ),
      should_run_gender_mismatch_check: false,
      should_run_fixture_team_gender_mismatch_check: false,
    };
  }
  const updated_state = await apply_dynamic_form_dependency_updates(
    params,
    params.entity_metadata,
  );
  return {
    ...updated_state,
    ...build_dynamic_form_dependency_change_flags(
      params.entity_type,
      params.changed_field_name,
    ),
  };
}

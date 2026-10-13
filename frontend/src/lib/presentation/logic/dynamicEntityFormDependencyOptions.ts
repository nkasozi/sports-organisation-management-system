import type {
  BaseEntity,
  EntityMetadata,
  FieldMetadata,
} from "../../core/entities/BaseEntity";
import {
  DYNAMIC_FORM_ENTITY_TYPE,
  DYNAMIC_FORM_FIELD_NAME,
  DYNAMIC_FORM_FOREIGN_KEY_FILTER_TYPE,
  DYNAMIC_FORM_JERSEY_FIELD_HINT,
  type DynamicFormData,
  normalize_dynamic_form_entity_type,
} from "./dynamicFormConstants";
import { read_dynamic_form_text_value } from "./dynamicFormDataAccess";
import {
  compute_teams_after_exclusion,
  fetch_filtered_entities_for_field,
} from "./dynamicFormDataLoader";

export type DynamicFormDependencyState = {
  form_data: DynamicFormData;
  foreign_key_options: Record<string, BaseEntity[]>;
  all_competition_teams_cache: BaseEntity[];
};

export type DynamicFormDependencyChangeFlags = {
  should_check_jersey_color_clashes: boolean;
  should_run_gender_mismatch_check: boolean;
  should_run_fixture_team_gender_mismatch_check: boolean;
};

const PLAYER_GENDER_CHECK_ENTITY_TYPES: readonly string[] = [
  DYNAMIC_FORM_ENTITY_TYPE.PLAYER_TEAM_MEMBERSHIP,
  DYNAMIC_FORM_ENTITY_TYPE.PLAYER_TEAM_TRANSFER_HISTORY,
];
const PLAYER_GENDER_CHECK_FIELDS: readonly string[] = [
  DYNAMIC_FORM_FIELD_NAME.PLAYER_ID,
  DYNAMIC_FORM_FIELD_NAME.TEAM_ID,
  DYNAMIC_FORM_FIELD_NAME.TO_TEAM_ID,
];
const FIXTURE_GENDER_CHECK_FIELDS: readonly string[] = [
  DYNAMIC_FORM_FIELD_NAME.HOME_TEAM_ID,
  DYNAMIC_FORM_FIELD_NAME.AWAY_TEAM_ID,
];

export function build_dynamic_form_dependency_change_flags(
  entity_type: string,
  changed_field_name: string,
): DynamicFormDependencyChangeFlags {
  const normalized_entity_type =
    normalize_dynamic_form_entity_type(entity_type);
  return {
    should_check_jersey_color_clashes: changed_field_name.includes(
      DYNAMIC_FORM_JERSEY_FIELD_HINT,
    ),
    should_run_gender_mismatch_check:
      PLAYER_GENDER_CHECK_ENTITY_TYPES.includes(normalized_entity_type) &&
      PLAYER_GENDER_CHECK_FIELDS.includes(changed_field_name),
    should_run_fixture_team_gender_mismatch_check:
      normalized_entity_type === DYNAMIC_FORM_ENTITY_TYPE.FIXTURE &&
      FIXTURE_GENDER_CHECK_FIELDS.includes(changed_field_name),
  };
}

export async function reload_dynamic_form_dependent_field_options(
  entity_metadata: EntityMetadata,
  changed_field_name: string,
  new_value: string,
  initial_state: DynamicFormDependencyState,
): Promise<DynamicFormDependencyState> {
  let current_state = initial_state;
  for (const field of entity_metadata.fields) {
    if (field.foreign_key_filter?.depends_on_field !== changed_field_name)
      continue;
    current_state = await resolve_filtered_field_options(field, new_value, {
      ...current_state,
      form_data: { ...current_state.form_data, [field.field_name]: "" },
    });
  }
  return current_state;
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
    state.foreign_key_options[DYNAMIC_FORM_FIELD_NAME.PLAYER_ID] || [],
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

export function update_team_exclusion_options(
  entity_metadata: EntityMetadata,
  form_data: DynamicFormData,
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
      field.foreign_key_filter?.filter_type !==
        DYNAMIC_FORM_FOREIGN_KEY_FILTER_TYPE.TEAMS_FROM_COMPETITION ||
      field.foreign_key_filter.exclude_field !== changed_field_name
    ) {
      continue;
    }

    const exclude_value = read_dynamic_form_text_value(
      form_data,
      changed_field_name,
    );
    updated_options[field.field_name] = compute_teams_after_exclusion(
      all_competition_teams_cache,
      exclude_value,
    );
  }

  return updated_options;
}

import {
  check_fixture_team_gender_mismatch,
  check_player_team_gender_mismatch,
  type FixtureTeamGenderMismatchInput,
  type GenderMismatchInput,
} from "../../core/services/genderMismatchCheck";
import {
  type GenderedRecord,
  pair_gender_ids,
  to_gendered_player,
  to_gendered_team,
} from "./dynamicEntityFormGenderedRecords";
import {
  build_gender_name_map,
  load_gendered_pair,
  type ReadByIdUseCases,
  resolve_use_cases_state,
  type UseCasesResult,
} from "./dynamicEntityFormGenderLookups";
import {
  DYNAMIC_FORM_ENTITY_TYPE,
  DYNAMIC_FORM_FIELD_NAME,
  type DynamicFormData,
  is_dynamic_form_entity_type,
} from "./dynamicFormConstants";
import { read_dynamic_form_text_value } from "./dynamicFormDataAccess";
import { PRESENCE_STATUS } from "./presenceStatus";

export type DynamicEntityFormGenderDependencies = {
  team_use_cases: ReadByIdUseCases;
  player_use_cases_result: UseCasesResult;
  gender_use_cases_result: UseCasesResult;
};

function read_player_gender_check_team_id(
  entity_type: string,
  form_data: DynamicFormData,
): string {
  return read_dynamic_form_text_value(
    form_data,
    is_dynamic_form_entity_type(
      entity_type,
      DYNAMIC_FORM_ENTITY_TYPE.PLAYER_TEAM_TRANSFER_HISTORY,
    )
      ? DYNAMIC_FORM_FIELD_NAME.TO_TEAM_ID
      : DYNAMIC_FORM_FIELD_NAME.TEAM_ID,
  );
}

export async function load_dynamic_form_player_gender_warnings(
  entity_type: string,
  form_data: DynamicFormData,
  dependencies: DynamicEntityFormGenderDependencies,
): Promise<string[]> {
  const player_id = read_dynamic_form_text_value(
    form_data,
    DYNAMIC_FORM_FIELD_NAME.PLAYER_ID,
  );
  const team_id = read_player_gender_check_team_id(entity_type, form_data);
  if (!player_id || !team_id) return [];
  const player_state = resolve_use_cases_state(
    dependencies.player_use_cases_result,
  );
  const gender_state = resolve_use_cases_state(
    dependencies.gender_use_cases_result,
  );
  if (
    player_state.status !== PRESENCE_STATUS.PRESENT ||
    gender_state.status !== PRESENCE_STATUS.PRESENT
  )
    return [];
  const pair_state = await load_gendered_pair(
    player_state.use_cases,
    player_id,
    dependencies.team_use_cases,
    team_id,
  );
  if (pair_state.status !== PRESENCE_STATUS.PRESENT) return [];
  return build_player_gender_warnings(
    to_gendered_player(pair_state.first),
    to_gendered_team(pair_state.second, team_id),
    gender_state.use_cases,
  );
}

async function build_player_gender_warnings(
  player: GenderedRecord,
  team: GenderedRecord,
  gender_use_cases: ReadByIdUseCases,
): Promise<string[]> {
  const gender_pair = pair_gender_ids(player, team);
  if (gender_pair.status !== PRESENCE_STATUS.PRESENT) return [];
  const gender_name_map = await build_gender_name_map(gender_use_cases, [
    gender_pair.first_gender_id,
    gender_pair.second_gender_id,
  ]);
  const mismatch_input: GenderMismatchInput = {
    player_gender_id: gender_pair.first_gender_id,
    team_gender_id: gender_pair.second_gender_id,
    player_display_name: player.display_name,
    team_display_name: team.display_name,
    gender_name_map,
  };
  return check_player_team_gender_mismatch(mismatch_input);
}

export async function load_dynamic_form_fixture_gender_warnings(
  form_data: DynamicFormData,
  dependencies: Omit<
    DynamicEntityFormGenderDependencies,
    "player_use_cases_result"
  >,
): Promise<string[]> {
  const home_team_id = read_dynamic_form_text_value(
    form_data,
    DYNAMIC_FORM_FIELD_NAME.HOME_TEAM_ID,
  );
  const away_team_id = read_dynamic_form_text_value(
    form_data,
    DYNAMIC_FORM_FIELD_NAME.AWAY_TEAM_ID,
  );
  if (!home_team_id || !away_team_id) return [];
  const gender_state = resolve_use_cases_state(
    dependencies.gender_use_cases_result,
  );
  if (gender_state.status !== PRESENCE_STATUS.PRESENT) return [];
  const pair_state = await load_gendered_pair(
    dependencies.team_use_cases,
    home_team_id,
    dependencies.team_use_cases,
    away_team_id,
  );
  if (pair_state.status !== PRESENCE_STATUS.PRESENT) return [];
  return build_fixture_gender_warnings(
    to_gendered_team(pair_state.first, home_team_id),
    to_gendered_team(pair_state.second, away_team_id),
    gender_state.use_cases,
  );
}

async function build_fixture_gender_warnings(
  home_team: GenderedRecord,
  away_team: GenderedRecord,
  gender_use_cases: ReadByIdUseCases,
): Promise<string[]> {
  const gender_pair = pair_gender_ids(home_team, away_team);
  if (gender_pair.status !== PRESENCE_STATUS.PRESENT) return [];
  const gender_name_map = await build_gender_name_map(gender_use_cases, [
    gender_pair.first_gender_id,
    gender_pair.second_gender_id,
  ]);
  const mismatch_input: FixtureTeamGenderMismatchInput = {
    home_team_gender_id: gender_pair.first_gender_id,
    away_team_gender_id: gender_pair.second_gender_id,
    home_team_display_name: home_team.display_name,
    away_team_display_name: away_team.display_name,
    gender_name_map,
  };
  return check_fixture_team_gender_mismatch(mismatch_input);
}

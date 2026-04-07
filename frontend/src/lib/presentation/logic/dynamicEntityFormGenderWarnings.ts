import {
  check_fixture_team_gender_mismatch,
  check_player_team_gender_mismatch,
  type FixtureTeamGenderMismatchInput,
  type GenderMismatchInput,
} from "../../core/services/genderMismatchCheck";

type ReadByIdUseCases = {
  get_by_id: (id: string) => Promise<{ success: boolean; data?: unknown }>;
};

type UseCasesResult = {
  success: boolean;
  data?: ReadByIdUseCases;
};

export type DynamicEntityFormGenderDependencies = {
  team_use_cases: ReadByIdUseCases;
  player_use_cases_result: UseCasesResult;
  gender_use_cases_result: UseCasesResult;
};

export async function load_dynamic_form_player_gender_warnings(
  entity_type: string,
  form_data: Record<string, any>,
  dependencies: DynamicEntityFormGenderDependencies,
): Promise<string[]> {
  const normalized_entity_type = entity_type.toLowerCase();
  const player_id = form_data["player_id"];
  const team_id =
    normalized_entity_type === "playerteamtransferhistory"
      ? form_data["to_team_id"]
      : form_data["team_id"];

  if (!player_id || !team_id) {
    return [];
  }

  if (
    !dependencies.player_use_cases_result.success ||
    !dependencies.gender_use_cases_result.success
  ) {
    return [];
  }

  const player_use_cases = dependencies.player_use_cases_result.data;
  const gender_use_cases = dependencies.gender_use_cases_result.data;
  if (!player_use_cases || !gender_use_cases) {
    return [];
  }

  const [player_result, team_result] = await Promise.all([
    player_use_cases.get_by_id(player_id),
    dependencies.team_use_cases.get_by_id(team_id),
  ]);
  if (!player_result.success || !team_result.success) {
    return [];
  }

  const player = player_result.data as {
    gender_id?: string;
    first_name?: string;
    last_name?: string;
  };
  const team = team_result.data as { gender_id?: string; name?: string };
  if (!player.gender_id || !team.gender_id) {
    return [];
  }

  const gender_name_map = await build_gender_name_map(gender_use_cases, [
    player.gender_id,
    team.gender_id,
  ]);
  const mismatch_input: GenderMismatchInput = {
    player_gender_id: player.gender_id,
    team_gender_id: team.gender_id,
    player_display_name:
      `${player.first_name ?? ""} ${player.last_name ?? ""}`.trim(),
    team_display_name: team.name ?? team_id,
    gender_name_map,
  };
  return check_player_team_gender_mismatch(mismatch_input);
}

export async function load_dynamic_form_fixture_gender_warnings(
  form_data: Record<string, any>,
  dependencies: Omit<
    DynamicEntityFormGenderDependencies,
    "player_use_cases_result"
  >,
): Promise<string[]> {
  const home_team_id = form_data["home_team_id"];
  const away_team_id = form_data["away_team_id"];
  if (!home_team_id || !away_team_id) {
    return [];
  }

  if (!dependencies.gender_use_cases_result.success) {
    return [];
  }

  const gender_use_cases = dependencies.gender_use_cases_result.data;
  if (!gender_use_cases) {
    return [];
  }

  const [home_team_result, away_team_result] = await Promise.all([
    dependencies.team_use_cases.get_by_id(home_team_id),
    dependencies.team_use_cases.get_by_id(away_team_id),
  ]);
  if (!home_team_result.success || !away_team_result.success) {
    return [];
  }

  const home_team = home_team_result.data as {
    gender_id?: string;
    name?: string;
  };
  const away_team = away_team_result.data as {
    gender_id?: string;
    name?: string;
  };
  if (!home_team.gender_id || !away_team.gender_id) {
    return [];
  }

  const gender_name_map = await build_gender_name_map(gender_use_cases, [
    home_team.gender_id,
    away_team.gender_id,
  ]);
  const mismatch_input: FixtureTeamGenderMismatchInput = {
    home_team_gender_id: home_team.gender_id,
    away_team_gender_id: away_team.gender_id,
    home_team_display_name: home_team.name ?? home_team_id,
    away_team_display_name: away_team.name ?? away_team_id,
    gender_name_map,
  };
  return check_fixture_team_gender_mismatch(mismatch_input);
}

async function build_gender_name_map(
  gender_use_cases: ReadByIdUseCases,
  gender_ids: string[],
): Promise<Map<string, string>> {
  const gender_name_map = new Map<string, string>();
  for (const gender_id of [...new Set(gender_ids)]) {
    const gender_result = await gender_use_cases.get_by_id(gender_id);
    if (!gender_result.success) continue;
    const gender = gender_result.data as { name?: string };
    if (gender.name) {
      gender_name_map.set(gender_id, gender.name);
    }
  }
  return gender_name_map;
}

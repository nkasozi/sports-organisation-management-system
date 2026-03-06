export interface GenderMismatchInput {
  player_gender_id: string;
  team_gender_id: string;
  player_display_name: string;
  team_display_name: string;
  gender_name_map: Map<string, string>;
}

export interface FixtureTeamGenderMismatchInput {
  home_team_gender_id: string;
  away_team_gender_id: string;
  home_team_display_name: string;
  away_team_display_name: string;
  gender_name_map: Map<string, string>;
}

export function check_player_team_gender_mismatch(
  input: GenderMismatchInput,
): string[] {
  if (!input.player_gender_id || !input.team_gender_id) return [];
  if (input.player_gender_id === input.team_gender_id) return [];

  const player_gender_name =
    input.gender_name_map.get(input.player_gender_id) || input.player_gender_id;

  const team_gender_name =
    input.gender_name_map.get(input.team_gender_id) || input.team_gender_id;

  return [
    `${input.player_display_name} is ${player_gender_name} but ${input.team_display_name} is a ${team_gender_name} team`,
  ];
}

export function check_fixture_team_gender_mismatch(
  input: FixtureTeamGenderMismatchInput,
): string[] {
  if (!input.home_team_gender_id || !input.away_team_gender_id) return [];
  if (input.home_team_gender_id === input.away_team_gender_id) return [];

  const home_gender_name =
    input.gender_name_map.get(input.home_team_gender_id) ||
    input.home_team_gender_id;

  const away_gender_name =
    input.gender_name_map.get(input.away_team_gender_id) ||
    input.away_team_gender_id;

  return [
    `${input.home_team_display_name} is a ${home_gender_name} team but ${input.away_team_display_name} is a ${away_gender_name} team. Are you sure this fixture is correct?`,
  ];
}

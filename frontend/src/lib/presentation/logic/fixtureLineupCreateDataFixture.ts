import { get_sport_by_id } from "$lib/adapters/persistence/sportService";
import type { Team } from "$lib/core/entities/Team";
import {
  get_authorization_preselect_values,
  type UserScopeProfile,
} from "$lib/core/interfaces/ports";
import { build_error_message } from "$lib/core/services/fixtureLineupWizard";
import { build_fixture_team_label_map } from "$lib/presentation/logic/fixtureLineupCreateState";

import type {
  FixtureLineupCreateDependencies,
  FixtureLineupCreateFixtureData,
} from "./fixtureLineupCreateDataTypes";

export async function load_fixture_lineup_create_fixture_data(
  fixture_id: string,
  current_auth_profile: UserScopeProfile | null,
  dependencies: FixtureLineupCreateDependencies,
): Promise<
  | { success: true; data: FixtureLineupCreateFixtureData }
  | { success: false; error_message: string; should_clear_fixture: boolean }
> {
  const fixture_result =
    await dependencies.fixture_use_cases.get_by_id(fixture_id);
  if (!fixture_result.success || !fixture_result.data)
    return {
      success: false,
      error_message: build_error_message(
        "Failed to load fixture.",
        "The selected fixture could not be found.",
        "Refresh the page and try selecting the fixture again.",
      ),
      should_clear_fixture: true,
    };
  const selected_fixture = fixture_result.data;
  if (selected_fixture.status !== "scheduled")
    return {
      success: false,
      error_message: build_error_message(
        "This fixture cannot accept lineup submissions.",
        `The fixture status is "${selected_fixture.status.replace(/_/g, " ")}". Only fixtures with "scheduled" status can receive new lineups.`,
        "Select a different fixture that is still scheduled.",
      ),
      should_clear_fixture: true,
    };
  const competition_result = await dependencies.competition_use_cases.get_by_id(
    selected_fixture.competition_id,
  );
  if (!competition_result.success || !competition_result.data)
    return {
      success: false,
      error_message: build_error_message(
        "Failed to load competition for fixture.",
        "Competition data is required to determine lineup rules.",
        "Ensure the fixture has a valid competition, then retry.",
      ),
      should_clear_fixture: false,
    };
  const competition = competition_result.data;
  const [
    organization_result,
    competition_teams_result,
    home_team_result,
    away_team_result,
    existing_lineups_result,
  ] = await Promise.all([
    dependencies.organization_use_cases.get_by_id(competition.organization_id),
    dependencies.competition_team_use_cases.list_teams_in_competition(
      competition.id,
      { page_number: 1, page_size: 2000 },
    ),
    dependencies.team_use_cases.get_by_id(selected_fixture.home_team_id),
    dependencies.team_use_cases.get_by_id(selected_fixture.away_team_id),
    dependencies.lineup_use_cases.list_lineups_by_fixture(fixture_id, {
      page: 1,
      page_size: 100,
    }),
  ]);
  let min_players = 2;
  let max_players = 18;
  let starters_count = 11;
  if (organization_result.success && organization_result.data?.sport_id) {
    const sport_result = await get_sport_by_id(
      organization_result.data.sport_id,
    );
    if (sport_result.success && sport_result.data) {
      min_players = sport_result.data.min_players_per_fixture || 2;
      max_players = sport_result.data.max_players_per_fixture || 18;
      starters_count = sport_result.data.max_players_on_field || 11;
    }
  }
  if (competition.rule_overrides) {
    if (competition.rule_overrides.min_players_on_field !== undefined)
      min_players = competition.rule_overrides.min_players_on_field;
    if (competition.rule_overrides.max_squad_size !== undefined)
      max_players = competition.rule_overrides.max_squad_size;
    if (competition.rule_overrides.max_players_on_field !== undefined)
      starters_count = competition.rule_overrides.max_players_on_field;
  }
  const teams: Team[] = [];
  if (home_team_result.success && home_team_result.data)
    teams.push(home_team_result.data);
  if (away_team_result.success && away_team_result.data)
    teams.push(away_team_result.data);
  const competition_teams_for_fixture =
    competition_teams_result.success && competition_teams_result.data
      ? competition_teams_result.data.items
      : [];
  const fixture_team_label_by_team_id = build_fixture_team_label_map(
    teams,
    competition_teams_for_fixture,
  );
  const teams_with_existing_lineups = new Map<string, string>();
  if (existing_lineups_result.success && existing_lineups_result.data) {
    for (const lineup of existing_lineups_result.data.items) {
      const matching_team = teams.find(
        (team: Team) => team.id === lineup.team_id,
      );
      teams_with_existing_lineups.set(
        lineup.team_id,
        matching_team
          ? fixture_team_label_by_team_id.get(matching_team.id) ||
              matching_team.name
          : lineup.team_id,
      );
    }
  }
  const available_teams = teams.filter(
    (team: Team) => !teams_with_existing_lineups.has(team.id),
  );
  if (available_teams.length === 0 && teams.length > 0)
    return {
      success: false,
      error_message: build_error_message(
        "All teams have already submitted lineups for this fixture.",
        `"${competition.name}" already has lineups from all participating teams.`,
        "Select a different fixture that still needs team lineups.",
      ),
      should_clear_fixture: true,
    };
  const preselect_values =
    get_authorization_preselect_values(current_auth_profile);
  if (
    preselect_values.team_id &&
    teams_with_existing_lineups.has(preselect_values.team_id)
  )
    return {
      success: false,
      error_message: build_error_message(
        "Your team has already submitted a lineup for this fixture.",
        "Each team can only submit one lineup per fixture.",
        "Select a different fixture or view your existing lineup.",
      ),
      should_clear_fixture: true,
    };
  return {
    success: true,
    data: {
      selected_fixture,
      organization_id: competition.organization_id,
      min_players,
      max_players,
      starters_count,
      teams,
      available_teams,
      competition_teams_for_fixture,
      fixture_team_label_by_team_id,
      teams_with_existing_lineups,
      auto_selected_team_id:
        preselect_values.team_id &&
        available_teams.some(
          (team: Team) => team.id === preselect_values.team_id,
        )
          ? preselect_values.team_id
          : "",
    },
  };
}

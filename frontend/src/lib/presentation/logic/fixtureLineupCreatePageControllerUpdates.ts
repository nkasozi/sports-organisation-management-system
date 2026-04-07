import type { Fixture } from "$lib/core/entities/Fixture";
import type { CreateFixtureLineupInput } from "$lib/core/entities/FixtureLineup";
import type { Organization } from "$lib/core/entities/Organization";
import type { Team } from "$lib/core/entities/Team";
import type { TeamPlayer } from "$lib/core/services/teamPlayers";

import type {
  FixtureLineupCreateReferenceData,
  FixtureLineupCreateTeamData,
} from "./fixtureLineupCreateData";

export function build_fixture_lineup_create_reference_state(
  reference_data: FixtureLineupCreateReferenceData,
): FixtureLineupCreateReferenceData {
  return {
    fixtures: reference_data.fixtures,
    teams: reference_data.teams,
    all_teams: reference_data.all_teams,
    all_competitions: reference_data.all_competitions,
    organizations: reference_data.organizations,
    selected_organization: reference_data.selected_organization,
    error_message: reference_data.error_message,
  };
}

export function build_fixture_lineup_create_fixture_change_state(
  fixture_change_result: {
    error_message: string;
    form_data: Partial<CreateFixtureLineupInput>;
    selected_fixture: Fixture | null;
    selected_organization: Organization | null;
    min_players: number;
    max_players: number;
    starters_count: number;
    available_teams: Team[];
    fixture_team_label_by_team_id: Map<string, string>;
    teams_with_existing_lineups: Map<string, string>;
    fixtures_with_complete_lineups: Set<string>;
  },
  form_data: CreateFixtureLineupInput,
): {
  error_message: string;
  form_data: CreateFixtureLineupInput;
  selected_fixture: Fixture | null;
  selected_organization: Organization | null;
  min_players: number;
  max_players: number;
  starters_count: number;
  available_teams: Team[];
  fixture_team_label_by_team_id: Map<string, string>;
  teams_with_existing_lineups: Map<string, string>;
  selected_team: Team | null;
  team_players: FixtureLineupCreateTeamData["team_players"];
  fixtures_with_complete_lineups: Set<string>;
} {
  return {
    error_message: fixture_change_result.error_message,
    form_data: { ...form_data, ...fixture_change_result.form_data },
    selected_fixture: fixture_change_result.selected_fixture,
    selected_organization: fixture_change_result.selected_organization,
    min_players: fixture_change_result.min_players,
    max_players: fixture_change_result.max_players,
    starters_count: fixture_change_result.starters_count,
    available_teams: fixture_change_result.available_teams,
    fixture_team_label_by_team_id:
      fixture_change_result.fixture_team_label_by_team_id,
    teams_with_existing_lineups:
      fixture_change_result.teams_with_existing_lineups,
    selected_team: null,
    team_players: [],
    fixtures_with_complete_lineups:
      fixture_change_result.fixtures_with_complete_lineups,
  };
}

export function build_fixture_lineup_create_team_change_state(
  team_data: {
    selected_team: Team | null;
    team_players: TeamPlayer[];
    selected_players: FixtureLineupCreateTeamData["selected_players"];
    validation_error: string;
  },
  form_data: CreateFixtureLineupInput,
  team_id: string,
): {
  selected_team: Team | null;
  team_players: FixtureLineupCreateTeamData["team_players"];
  form_data: CreateFixtureLineupInput;
  validation_errors: Record<string, string>;
} {
  return {
    selected_team: team_data.selected_team,
    team_players: team_data.team_players,
    form_data: {
      ...form_data,
      team_id,
      selected_players: team_data.selected_players,
    },
    validation_errors: team_data.validation_error
      ? { players: team_data.validation_error }
      : {},
  };
}

export function get_fixture_lineup_create_validation_field(
  step_index: number,
): string {
  return ["organization_id", "fixture_id", "team_id", "players", "confirm"][
    step_index
  ];
}

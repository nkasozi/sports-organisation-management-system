import type { Competition } from "$lib/core/entities/Competition";
import type { Fixture } from "$lib/core/entities/Fixture";
import {
  create_empty_fixture_lineup_input,
  type CreateFixtureLineupInput,
} from "$lib/core/entities/FixtureLineup";
import type { Organization } from "$lib/core/entities/Organization";
import type { Team } from "$lib/core/entities/Team";
import type { TeamPlayer } from "$lib/core/services/teamPlayers";

import { DEFAULT_FIXTURE_LINEUP_PLAYER_LIMITS } from "./fixtureLineupCreateDataFixtureRules";
import type {
  FixtureLineupCreateAuthProfileState,
  FixtureLineupCreateFixtureState,
  FixtureLineupCreateOrganizationState,
  FixtureLineupCreateTeamState,
} from "./fixtureLineupCreatePageContracts";

interface FixtureLineupCreatePageControllerState {
  form_data: CreateFixtureLineupInput;
  selected_fixture_state: FixtureLineupCreateFixtureState;
  selected_team_state: FixtureLineupCreateTeamState;
  selected_organization_state: FixtureLineupCreateOrganizationState;
  team_players: TeamPlayer[];
  min_players: number;
  max_players: number;
  starters_count: number;
  current_step_index: number;
  confirm_lock_understood: boolean;
  player_search_text: string;
  loading: boolean;
  saving: boolean;
  error_message: string;
  organizations: Organization[];
  fixtures: Fixture[];
  all_teams: Team[];
  all_competitions: Competition[];
  available_teams: Team[];
  fixtures_with_complete_lineups: Set<string>;
  validation_errors: Record<string, string>;
  fixture_team_label_by_team_id: Map<string, string>;
  teams_with_existing_lineups: Map<string, string>;
  current_auth_profile_state: FixtureLineupCreateAuthProfileState;
}

export function create_fixture_lineup_create_page_controller_state(): FixtureLineupCreatePageControllerState {
  return {
    form_data: create_empty_fixture_lineup_input(),
    selected_fixture_state: { status: "missing" },
    selected_team_state: { status: "missing" },
    selected_organization_state: { status: "missing" },
    team_players: [],
    ...DEFAULT_FIXTURE_LINEUP_PLAYER_LIMITS,
    current_step_index: 0,
    confirm_lock_understood: false,
    player_search_text: "",
    loading: true,
    saving: false,
    error_message: "",
    organizations: [],
    fixtures: [],
    all_teams: [],
    all_competitions: [],
    available_teams: [],
    fixtures_with_complete_lineups: new Set<string>(),
    validation_errors: {},
    fixture_team_label_by_team_id: new Map<string, string>(),
    teams_with_existing_lineups: new Map<string, string>(),
    current_auth_profile_state: { status: "missing" },
  };
}

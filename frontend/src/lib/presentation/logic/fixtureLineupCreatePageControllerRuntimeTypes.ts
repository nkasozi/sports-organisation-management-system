import type { Competition } from "$lib/core/entities/Competition";
import type { Fixture } from "$lib/core/entities/Fixture";
import type { CreateFixtureLineupInput } from "$lib/core/entities/FixtureLineup";
import type { Organization } from "$lib/core/entities/Organization";
import type { Team } from "$lib/core/entities/Team";
import type { TeamPlayer } from "$lib/core/services/teamPlayers";

import { create_fixture_lineup_create_dependencies } from "./fixtureLineupCreateData";
import type {
  FixtureLineupCreateAuthProfileState,
  FixtureLineupCreateFixtureState,
  FixtureLineupCreateOrganizationState,
  FixtureLineupCreateTeamState,
} from "./fixtureLineupCreatePageContracts";

export interface FixtureLineupCreatePageControllerRuntimeCommand {
  dependencies: ReturnType<typeof create_fixture_lineup_create_dependencies>;
  get_confirm_lock_understood: () => boolean;
  get_current_auth_profile_state: () => FixtureLineupCreateAuthProfileState;
  get_form_data: () => CreateFixtureLineupInput;
  get_fixtures_with_complete_lineups: () => Set<string>;
  get_max_players: () => number;
  get_min_players: () => number;
  get_organization_is_restricted: () => boolean;
  get_organizations: () => Organization[];
  get_selected_fixture_state: () => FixtureLineupCreateFixtureState;
  get_selected_organization_state: () => FixtureLineupCreateOrganizationState;
  get_selected_team_state: () => FixtureLineupCreateTeamState;
  get_team_players: () => TeamPlayer[];
  goto: (path: string) => Promise<unknown>;
  is_browser: boolean;
  set_all_competitions: (value: Competition[]) => void;
  set_all_teams: (value: Team[]) => void;
  set_available_teams: (value: Team[]) => void;
  set_confirm_lock_understood: (value: boolean) => void;
  set_current_step_index: (value: number) => void;
  set_error_message: (value: string) => void;
  set_fixture_team_label_by_team_id: (value: Map<string, string>) => void;
  set_fixtures: (value: Fixture[]) => void;
  set_fixtures_with_complete_lineups: (value: Set<string>) => void;
  set_form_data: (value: CreateFixtureLineupInput) => void;
  set_loading: (value: boolean) => void;
  set_max_players: (value: number) => void;
  set_min_players: (value: number) => void;
  set_organizations: (value: Organization[]) => void;
  set_player_search_text: (value: string) => void;
  set_saving: (value: boolean) => void;
  set_selected_fixture_state: (value: FixtureLineupCreateFixtureState) => void;
  set_selected_organization_state: (
    value: FixtureLineupCreateOrganizationState,
  ) => void;
  set_selected_team_state: (value: FixtureLineupCreateTeamState) => void;
  set_starters_count: (value: number) => void;
  set_team_players: (value: TeamPlayer[]) => void;
  set_teams_with_existing_lineups: (value: Map<string, string>) => void;
  set_validation_errors: (value: Record<string, string>) => void;
}

export interface FixtureLineupCreatePageControllerRuntime {
  deselect_all_players: () => void;
  handle_fixture_change: (fixture_id: string) => Promise<void>;
  handle_organization_change: (organization_id: string) => void;
  handle_step_change_attempt: (
    from_step_index: number,
    to_step_index: number,
  ) => boolean;
  handle_submit_locked_lineup: () => Promise<void>;
  handle_team_change: (team_id: string) => Promise<void>;
  initialize_page: () => Promise<void>;
  select_all_players: () => void;
  toggle_player_selection: (player_id: string) => void;
}

import type { DataAction } from "$lib/core/interfaces/ports";
import type { TeamPlayer } from "$lib/core/services/teamPlayers";

import type { save_fixture_lineup_changes } from "./fixtureLineupDetailPageActions";
import type {
  FixtureLineupDetailFixtureState,
  FixtureLineupDetailLineupState,
  FixtureLineupDetailProfileState,
  FixtureLineupDetailTeamState,
  FixtureLineupDetailTokenState,
} from "./fixtureLineupDetailPageContracts";
import type { load_fixture_lineup_detail_view_data } from "./fixtureLineupDetailPageData";

type FixtureLineupDetailViewDependencies = Parameters<
  typeof load_fixture_lineup_detail_view_data
>[2];
type UpdateFixtureLineup = Parameters<typeof save_fixture_lineup_changes>[2];

export interface FixtureLineupDetailPageControllerRuntimeCommand {
  access_denied_message: string;
  access_denial_path: string;
  access_check_failed_message: string;
  entity_type: string;
  get_auth_state: () => {
    current_profile_state: FixtureLineupDetailProfileState;
    current_token_state: FixtureLineupDetailTokenState;
  };
  get_lineup_state: () => FixtureLineupDetailLineupState;
  get_team_players: () => TeamPlayer[];
  goto: (path: string) => Promise<unknown>;
  is_browser: boolean;
  lineup_id: string;
  lineup_list_path: string;
  read_action: DataAction;
  set_access_denial: (path: string, message: string) => void;
  set_away_team_state: (value: FixtureLineupDetailTeamState) => void;
  set_can_modify_lineup: (value: boolean) => void;
  set_error_message: (value: string) => void;
  set_fixture_state: (value: FixtureLineupDetailFixtureState) => void;
  set_home_team_state: (value: FixtureLineupDetailTeamState) => void;
  set_lineup_state: (value: FixtureLineupDetailLineupState) => void;
  set_loading: (value: boolean) => void;
  set_permission_info_message: (value: string) => void;
  set_saving: (value: boolean) => void;
  set_team_state: (value: FixtureLineupDetailTeamState) => void;
  set_team_players: (value: TeamPlayer[]) => void;
  submit_confirmation: string;
  submit_failed_message: string;
  update_action: DataAction;
  update_failed_message: string;
  use_cases: {
    fixture_lineup_use_cases: { update: UpdateFixtureLineup };
    fixture_use_cases: {
      get_by_id: FixtureLineupDetailViewDependencies["get_fixture_by_id"];
    };
    membership_use_cases: {
      list_memberships_by_team: FixtureLineupDetailViewDependencies["list_memberships_by_team"];
    };
    player_position_use_cases: {
      list: FixtureLineupDetailViewDependencies["list_positions"];
    };
    player_use_cases: {
      list_players_by_team: FixtureLineupDetailViewDependencies["list_players_by_team"];
    };
    team_use_cases: {
      get_by_id: FixtureLineupDetailViewDependencies["get_team_by_id"];
    };
  };
}

export interface FixtureLineupDetailPageControllerRuntime {
  handle_save: () => Promise<void>;
  handle_submit: () => Promise<void>;
  handle_toggle_player_selection: (player_id: string) => void;
  initialize_page: () => Promise<boolean>;
}

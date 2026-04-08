import {
  get_fixture_lineup_by_id,
  submit_lineup,
} from "$lib/adapters/persistence/fixtureLineupService";
import type { Fixture } from "$lib/core/entities/Fixture";
import type { FixtureLineup } from "$lib/core/entities/FixtureLineup";
import type { Team } from "$lib/core/entities/Team";
import type { DataAction, UserScopeProfile } from "$lib/core/interfaces/ports";
import type { TeamPlayer } from "$lib/core/services/teamPlayers";
import { get_authorization_adapter } from "$lib/infrastructure/AuthorizationProvider";

import { ensure_auth_profile } from "./authGuard";
import {
  authorize_fixture_lineup_detail_page,
  save_fixture_lineup_changes,
  submit_fixture_lineup_changes,
} from "./fixtureLineupDetailPageActions";
import { load_fixture_lineup_detail_view_data } from "./fixtureLineupDetailPageData";
import { toggle_fixture_lineup_player_selection } from "./fixtureLineupDetailPageState";

type FixtureLineupDetailViewDependencies = Parameters<
  typeof load_fixture_lineup_detail_view_data
>[2];
type UpdateFixtureLineup = Parameters<typeof save_fixture_lineup_changes>[2];

export function create_fixture_lineup_detail_page_controller_runtime(command: {
  access_denied_message: string;
  access_denial_path: string;
  access_check_failed_message: string;
  entity_type: string;
  get_auth_state: () => {
    current_profile: UserScopeProfile | null;
    current_token?: { raw_token: string } | null;
  };
  get_lineup: () => FixtureLineup | null;
  get_team_players: () => TeamPlayer[];
  goto: (path: string) => Promise<unknown>;
  is_browser: boolean;
  lineup_id: string;
  lineup_list_path: string;
  read_action: DataAction;
  set_access_denial: (path: string, message: string) => void;
  set_away_team: (value: Team | null) => void;
  set_can_modify_lineup: (value: boolean) => void;
  set_error_message: (value: string) => void;
  set_fixture: (value: Fixture | null) => void;
  set_home_team: (value: Team | null) => void;
  set_lineup: (value: FixtureLineup | null) => void;
  set_loading: (value: boolean) => void;
  set_permission_info_message: (value: string) => void;
  set_saving: (value: boolean) => void;
  set_team: (value: Team | null) => void;
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
}): {
  handle_save: () => Promise<void>;
  handle_submit: () => Promise<void>;
  handle_toggle_player_selection: (player_id: string) => void;
  initialize_page: () => Promise<void>;
} {
  return {
    initialize_page: async (): Promise<void> => {
      if (!command.is_browser) return;
      const auth_result = await ensure_auth_profile();
      if (!auth_result.success) {
        command.set_error_message(auth_result.error_message);
        command.set_loading(false);
        return;
      }
      const auth_state = command.get_auth_state();
      if (auth_state.current_token) {
        const authorization_result = await authorize_fixture_lineup_detail_page(
          get_authorization_adapter(),
          auth_state.current_token.raw_token,
          command.entity_type,
          command.read_action,
          command.update_action,
          command.access_check_failed_message,
        );
        if (!authorization_result.success) {
          command.set_error_message(authorization_result.error_message);
          command.set_loading(false);
          return;
        }
        if (!authorization_result.is_read_authorized) {
          command.set_access_denial(
            `${command.access_denial_path}/${command.lineup_id}`,
            command.access_denied_message,
          );
          await command.goto("/");
          return;
        }
        command.set_can_modify_lineup(authorization_result.can_modify_lineup);
        command.set_permission_info_message(
          authorization_result.permission_info_message,
        );
      }
      command.set_loading(true);
      command.set_error_message("");
      const result = await load_fixture_lineup_detail_view_data(
        command.lineup_id,
        command.get_auth_state().current_profile,
        {
          get_fixture_lineup_by_id,
          get_fixture_by_id: command.use_cases.fixture_use_cases.get_by_id,
          get_team_by_id: command.use_cases.team_use_cases.get_by_id,
          list_players_by_team:
            command.use_cases.player_use_cases.list_players_by_team,
          list_memberships_by_team:
            command.use_cases.membership_use_cases.list_memberships_by_team,
          list_positions: command.use_cases.player_position_use_cases.list,
        },
      );
      if (!result.success) {
        command.set_error_message(result.error_message);
        command.set_loading(false);
        return;
      }
      command.set_lineup(result.data.lineup);
      command.set_fixture(result.data.fixture);
      command.set_team(result.data.team);
      command.set_team_players(result.data.team_players);
      command.set_home_team(result.data.home_team);
      command.set_away_team(result.data.away_team);
      command.set_loading(false);
    },
    handle_toggle_player_selection: (player_id: string): void => {
      const lineup = command.get_lineup();
      if (!lineup) return;
      command.set_lineup(
        toggle_fixture_lineup_player_selection(
          lineup,
          command.get_team_players(),
          player_id,
        ),
      );
    },
    handle_save: async (): Promise<void> => {
      const lineup = command.get_lineup();
      if (!lineup) return;
      command.set_saving(true);
      command.set_error_message("");
      const result = await save_fixture_lineup_changes(
        command.lineup_id,
        lineup,
        command.use_cases.fixture_lineup_use_cases.update,
        command.update_failed_message,
      );
      command.set_saving(false);
      if (!result.success) {
        command.set_error_message(result.error_message);
        return;
      }
      await command.goto(command.lineup_list_path);
    },
    handle_submit: async (): Promise<void> => {
      if (!command.get_lineup() || !confirm(command.submit_confirmation))
        return;
      command.set_saving(true);
      const result = await submit_fixture_lineup_changes(
        command.lineup_id,
        submit_lineup,
        command.submit_failed_message,
      );
      command.set_saving(false);
      if (!result.success) {
        command.set_error_message(result.error_message);
        return;
      }
      await command.goto(command.lineup_list_path);
    },
  };
}

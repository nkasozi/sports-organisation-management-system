import { get_fixture_lineup_by_id } from "$lib/adapters/persistence/fixtureLineupService";
import { get_authorization_adapter } from "$lib/infrastructure/AuthorizationProvider";
import { PRESENCE_STATUS } from "$lib/presentation/logic/presenceStatus";

import { ensure_auth_profile } from "./authGuard";
import { authorize_fixture_lineup_detail_page } from "./fixtureLineupDetailPageActions";
import type { FixtureLineupDetailProfileState } from "./fixtureLineupDetailPageContracts";
import type { FixtureLineupDetailPageControllerRuntimeCommand } from "./fixtureLineupDetailPageControllerRuntimeTypes";
import { load_fixture_lineup_detail_view_data } from "./fixtureLineupDetailPageData";

type RuntimeCommand = FixtureLineupDetailPageControllerRuntimeCommand;

const AuthorizationOutcome = {
  CONTINUE: "continue",
  STOP: "stop",
} as const;

type AuthorizationOutcomeValue =
  (typeof AuthorizationOutcome)[keyof typeof AuthorizationOutcome];

function stop_with_error(
  command: RuntimeCommand,
  error_message: string,
): boolean {
  command.set_error_message(error_message);
  command.set_loading(false);
  return false;
}

async function apply_fixture_lineup_detail_authorization(
  command: RuntimeCommand,
  raw_token: string,
): Promise<AuthorizationOutcomeValue> {
  const authorization_result = await authorize_fixture_lineup_detail_page(
    get_authorization_adapter(),
    raw_token,
    command.entity_type,
    command.read_action,
    command.update_action,
    command.access_check_failed_message,
  );
  if (!authorization_result.success) {
    stop_with_error(command, authorization_result.error_message);
    return AuthorizationOutcome.STOP;
  }
  if (!authorization_result.is_read_authorized) {
    command.set_access_denial(
      `${command.access_denial_path}/${command.lineup_id}`,
      command.access_denied_message,
    );
    await command.goto("/");
    return AuthorizationOutcome.STOP;
  }
  command.set_can_modify_lineup(authorization_result.can_modify_lineup);
  command.set_permission_info_message(
    authorization_result.permission_info_message,
  );
  return AuthorizationOutcome.CONTINUE;
}

async function load_and_apply_fixture_lineup_detail_view(
  command: RuntimeCommand,
  current_profile_state: FixtureLineupDetailProfileState,
): Promise<boolean> {
  command.set_loading(true);
  command.set_error_message("");
  const use_cases = command.use_cases;
  const result = await load_fixture_lineup_detail_view_data(
    command.lineup_id,
    current_profile_state,
    {
      get_fixture_lineup_by_id,
      get_fixture_by_id: use_cases.fixture_use_cases.get_by_id,
      get_team_by_id: use_cases.team_use_cases.get_by_id,
      list_players_by_team: use_cases.player_use_cases.list_players_by_team,
      list_memberships_by_team:
        use_cases.membership_use_cases.list_memberships_by_team,
      list_positions: use_cases.player_position_use_cases.list,
    },
  );
  if (!result.success) return stop_with_error(command, result.error_message);
  command.set_lineup_state({ status: "present", lineup: result.data.lineup });
  command.set_fixture_state(result.data.fixture_state);
  command.set_team_state(result.data.team_state);
  command.set_team_players(result.data.team_players);
  command.set_home_team_state(result.data.home_team_state);
  command.set_away_team_state(result.data.away_team_state);
  command.set_loading(false);
  return true;
}

export async function initialize_fixture_lineup_detail_runtime_page(
  command: RuntimeCommand,
): Promise<boolean> {
  if (!command.is_browser) return false;
  const auth_result = await ensure_auth_profile();
  if (!auth_result.success)
    return stop_with_error(command, auth_result.error_message);
  const auth_state = command.get_auth_state();
  const authorization_outcome =
    auth_state.current_token_state.status === PRESENCE_STATUS.PRESENT
      ? await apply_fixture_lineup_detail_authorization(
          command,
          auth_state.current_token_state.raw_token,
        )
      : AuthorizationOutcome.CONTINUE;
  if (authorization_outcome === AuthorizationOutcome.STOP) return false;
  return load_and_apply_fixture_lineup_detail_view(
    command,
    auth_state.current_profile_state,
  );
}

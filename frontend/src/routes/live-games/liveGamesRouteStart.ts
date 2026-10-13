import { can_role_access_route } from "$lib/adapters/iam/LocalAuthorizationAdapter";
import type { Fixture } from "$lib/core/entities/Fixture";
import type { PreFlightCheck } from "$lib/core/services/fixtureStartChecks";
import {
  type AsyncResult,
  create_failure_result,
  create_success_result,
} from "$lib/core/types/Result";
import { validate_live_games_start_permission } from "$lib/presentation/logic/liveGamesAccessLogic";
import { LIVE_GAMES_USER_MESSAGE } from "$lib/presentation/logic/liveGamesMessages";
import { live_games_page_dependencies } from "$lib/presentation/logic/liveGamesPageDependencies";
import {
  build_live_games_start_flow_dependencies,
  get_live_games_current_role,
  get_live_games_current_token_state,
  LIVE_GAMES_PENDING_START_STATUS,
  type LiveGamesPendingStartFixtureState,
} from "$lib/presentation/logic/liveGamesPageState";
import { PRESENCE_STATUS } from "$lib/presentation/logic/presenceStatus";
import type { AuthState } from "$lib/presentation/stores/authTypes";

export const IDLE_PENDING_START: LiveGamesPendingStartFixtureState = {
  status: LIVE_GAMES_PENDING_START_STATUS.IDLE,
};

interface LiveGamesRouteStartCallbacks {
  goto: (path: string) => Promise<void>;
  get_auth_state: () => AuthState;
  set_checks: (fixture_id: string, checks: PreFlightCheck[]) => unknown;
  set_is_starting: (fixture_id: string, value: boolean) => unknown;
}

export function build_live_games_route_start_dependencies(
  callbacks: LiveGamesRouteStartCallbacks,
): ReturnType<typeof build_live_games_start_flow_dependencies> {
  return build_live_games_start_flow_dependencies({
    ...live_games_page_dependencies,
    goto: callbacks.goto,
    get_current_role: () =>
      get_live_games_current_role(callbacks.get_auth_state()),
    can_access_route: (role: string, route: string) =>
      can_role_access_route(role as never, route).allowed,
    update_checks: (fixture_id: string, checks: PreFlightCheck[]): void => {
      callbacks.set_checks(fixture_id, checks);
    },
    set_is_starting: (fixture_id: string, value: boolean): void => {
      callbacks.set_is_starting(fixture_id, value);
    },
  });
}

export async function request_live_games_start_confirmation(
  fixture: Fixture,
  auth_state: AuthState,
): AsyncResult<LiveGamesPendingStartFixtureState> {
  const token_state = get_live_games_current_token_state(auth_state);
  if (token_state.status === PRESENCE_STATUS.MISSING)
    return create_failure_result(LIVE_GAMES_USER_MESSAGE.NO_USER_PROFILE_FOUND);
  const start_permission_error = await validate_live_games_start_permission(
    token_state.raw_token,
    live_games_page_dependencies.authorization_adapter,
  );
  if (start_permission_error)
    return create_failure_result(start_permission_error);
  return create_success_result({
    status: LIVE_GAMES_PENDING_START_STATUS.CONFIRMING,
    fixture,
  });
}

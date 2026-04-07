import type { Organization } from "$lib/core/entities/Organization";
import type { UserScopeProfile } from "$lib/core/interfaces/ports";
import type { PreFlightCheck } from "$lib/core/services/fixtureStartChecks";
import type { AuthState } from "$lib/presentation/stores/auth";

import type { LiveGamesAuthorizationAdapter } from "./liveGamesAccessLogic";
import { load_live_games_permissions } from "./liveGamesAccessLogic";
import {
  type LiveGamesDataDependencies,
  type LiveGamesFixtureState,
  load_live_games_fixture_state,
  load_live_games_organizations,
} from "./liveGamesDataLoader";
import type { LiveGamesStartFlowDependencies } from "./liveGamesStartFlow";

const DEFAULT_LIVE_GAMES_ROLE = "player";
const NO_USER_PROFILE_FOUND_MESSAGE = "No user profile found";
const LIVE_GAMES_PAGE_STATUS_ERROR = "error";
const LIVE_GAMES_PAGE_STATUS_DENIED = "denied";
const LIVE_GAMES_PAGE_STATUS_READY = "ready";

interface EnsureAuthProfileResult {
  success: boolean;
  error_message: string;
}

export interface LiveGamesPageInitializationCommand {
  ensure_auth_profile: () => Promise<EnsureAuthProfileResult>;
  auth_state: Pick<AuthState, "current_profile" | "current_token">;
  authorization_adapter: LiveGamesAuthorizationAdapter;
  organization_use_cases: LiveGamesDataDependencies["organization_use_cases"];
  fixture_state_dependencies: LiveGamesDataDependencies;
}

export interface LiveGamesPageFixtureStateCommand {
  auth_state: Pick<AuthState, "current_profile">;
  fixture_state_dependencies: LiveGamesDataDependencies;
  organization_id: string;
}

export interface LiveGamesPageStartFlowCommand extends Omit<
  LiveGamesStartFlowDependencies,
  "delay" | "restart" | "check_delay_ms"
> {
  check_delay_ms: number;
}

export type LiveGamesPageInitializationResult =
  | {
      status: typeof LIVE_GAMES_PAGE_STATUS_ERROR;
      error_message: string;
    }
  | {
      status: typeof LIVE_GAMES_PAGE_STATUS_DENIED;
      denial_reason: string;
    }
  | {
      status: typeof LIVE_GAMES_PAGE_STATUS_READY;
      organizations: Organization[];
      selected_organization_id: string;
      can_start_games: boolean;
      permission_info_message: string;
      fixture_state: LiveGamesFixtureState;
    };

function create_empty_live_games_fixture_state(): LiveGamesFixtureState {
  return {
    fixtures: [],
    team_names: {},
    team_logo_urls: {},
    competition_names: {},
    sport_names: {},
  };
}

export function get_live_games_current_profile(
  auth_state: Pick<AuthState, "current_profile">,
): UserScopeProfile | null {
  return auth_state.current_profile as UserScopeProfile | null;
}

export function get_live_games_current_role(
  auth_state: Pick<AuthState, "current_profile">,
): string {
  return (
    (auth_state.current_profile as { role?: string } | null)?.role ||
    DEFAULT_LIVE_GAMES_ROLE
  );
}

export function update_live_games_checks(
  current_checks: Record<string, PreFlightCheck[]>,
  fixture_id: string,
  checks: PreFlightCheck[],
): Record<string, PreFlightCheck[]> {
  return { ...current_checks, [fixture_id]: [...checks] };
}

export function update_live_games_starting_state(
  current_state: Record<string, boolean>,
  fixture_id: string,
  value: boolean,
): Record<string, boolean> {
  return { ...current_state, [fixture_id]: value };
}

export function wait_for_live_games_delay(milliseconds: number): Promise<void> {
  return new Promise((resolve: () => void) =>
    setTimeout(resolve, milliseconds),
  );
}

export async function refresh_live_games_page_fixture_state(
  command: LiveGamesPageFixtureStateCommand,
): Promise<LiveGamesFixtureState> {
  if (!command.organization_id) return create_empty_live_games_fixture_state();

  return load_live_games_fixture_state(
    command.fixture_state_dependencies,
    get_live_games_current_profile(command.auth_state),
    command.organization_id,
  );
}

export async function initialize_live_games_page(
  command: LiveGamesPageInitializationCommand,
): Promise<LiveGamesPageInitializationResult> {
  const auth_result = await command.ensure_auth_profile();
  if (!auth_result.success) {
    return {
      status: LIVE_GAMES_PAGE_STATUS_ERROR,
      error_message: auth_result.error_message,
    };
  }

  if (!command.auth_state.current_token) {
    return {
      status: LIVE_GAMES_PAGE_STATUS_ERROR,
      error_message: NO_USER_PROFILE_FOUND_MESSAGE,
    };
  }

  const permissions = await load_live_games_permissions(
    command.auth_state.current_token.raw_token,
    command.authorization_adapter,
  );
  if (!permissions.authorization_succeeded) {
    return {
      status: LIVE_GAMES_PAGE_STATUS_ERROR,
      error_message: "",
    };
  }
  if (!permissions.is_read_authorized) {
    return {
      status: LIVE_GAMES_PAGE_STATUS_DENIED,
      denial_reason: permissions.denial_reason,
    };
  }

  const organizations = await load_live_games_organizations(
    { organization_use_cases: command.organization_use_cases },
    get_live_games_current_profile(command.auth_state),
  );
  const selected_organization_id = organizations[0]?.id || "";
  const fixture_state = await refresh_live_games_page_fixture_state({
    auth_state: command.auth_state,
    fixture_state_dependencies: command.fixture_state_dependencies,
    organization_id: selected_organization_id,
  });

  return {
    status: LIVE_GAMES_PAGE_STATUS_READY,
    organizations,
    selected_organization_id,
    can_start_games: permissions.can_start_games,
    permission_info_message: permissions.permission_info_message,
    fixture_state,
  };
}

export function build_live_games_start_flow_dependencies(
  command: LiveGamesPageStartFlowCommand,
): Omit<LiveGamesStartFlowDependencies, "restart"> {
  return {
    ...command,
    delay: wait_for_live_games_delay,
  };
}

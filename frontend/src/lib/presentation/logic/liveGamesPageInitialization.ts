import {
  type AsyncResult,
  create_success_result,
} from "$lib/core/types/Result";

import {
  build_public_viewer_live_games_permissions,
  load_live_games_permissions,
} from "./liveGamesAccessLogic";
import {
  type LiveGamesFixtureState,
  load_live_games_fixture_state,
  load_live_games_organizations,
} from "./liveGamesDataLoader";
import { LIVE_GAMES_USER_MESSAGE } from "./liveGamesMessages";
import {
  list_live_games_organization_candidates,
  load_first_organization_with_fixtures,
} from "./liveGamesOrganizationChoice";
import {
  get_live_games_current_profile_state,
  get_live_games_current_token_state,
} from "./liveGamesPageAuthState";
import {
  LIVE_GAMES_AUTHORIZATION_STATUS,
  LIVE_GAMES_PAGE_STATUS,
  type LiveGamesPageAuthorizationResult,
  type LiveGamesPageFixtureStateCommand,
  type LiveGamesPageInitializationCommand,
  type LiveGamesPageInitializationResult,
  type LiveGamesPageNotReadyResult,
  type LiveGamesPagePermissions,
} from "./liveGamesPageInitializationTypes";
import {
  is_public_viewer_profile,
  load_public_live_games_data_when_public,
} from "./liveGamesPublicData";
import { select_live_games_organization_id } from "./liveGamesStartResume";
import { PRESENCE_STATUS } from "./presenceStatus";

function create_empty_live_games_fixture_state(): LiveGamesFixtureState {
  return {
    fixtures: [],
    team_names: {},
    team_logo_urls: {},
    competition_names: {},
    sport_names: {},
  };
}

export async function refresh_live_games_page_fixture_state_result(
  command: LiveGamesPageFixtureStateCommand,
): AsyncResult<LiveGamesFixtureState> {
  if (!command.organization_id) {
    return create_success_result(create_empty_live_games_fixture_state());
  }
  await load_public_live_games_data_when_public(
    command.fixture_state_dependencies,
    command.auth_state,
    command.organization_id,
  );
  return load_live_games_fixture_state(
    command.fixture_state_dependencies,
    get_live_games_current_profile_state(command.auth_state),
    command.organization_id,
  );
}

export async function refresh_live_games_page_fixture_state(
  command: LiveGamesPageFixtureStateCommand,
): Promise<LiveGamesFixtureState> {
  const result = await refresh_live_games_page_fixture_state_result(command);
  return result.success ? result.data : create_empty_live_games_fixture_state();
}

function build_not_ready_result(
  result: LiveGamesPageNotReadyResult,
): LiveGamesPageAuthorizationResult {
  return { status: LIVE_GAMES_AUTHORIZATION_STATUS.NOT_READY, result };
}

async function authorize_live_games_page(
  command: LiveGamesPageInitializationCommand,
): Promise<LiveGamesPageAuthorizationResult> {
  const auth_result = await command.ensure_auth_profile();
  if (!auth_result.success)
    return build_not_ready_result({
      status: LIVE_GAMES_PAGE_STATUS.ERROR,
      error_message: auth_result.error_message,
    });
  if (is_public_viewer_profile(command.auth_state))
    return {
      status: LIVE_GAMES_AUTHORIZATION_STATUS.AUTHORIZED,
      permissions: build_public_viewer_live_games_permissions(),
    };
  const token_state = get_live_games_current_token_state(command.auth_state);
  if (token_state.status === PRESENCE_STATUS.MISSING)
    return build_not_ready_result({
      status: LIVE_GAMES_PAGE_STATUS.ERROR,
      error_message: LIVE_GAMES_USER_MESSAGE.NO_USER_PROFILE_FOUND,
    });
  const permissions = await load_live_games_permissions(
    token_state.raw_token,
    command.authorization_adapter,
  );
  if (!permissions.authorization_succeeded)
    return build_not_ready_result({
      status: LIVE_GAMES_PAGE_STATUS.ERROR,
      error_message: LIVE_GAMES_USER_MESSAGE.PERMISSION_CHECK_FAILED,
    });
  if (!permissions.is_read_authorized)
    return build_not_ready_result({
      status: LIVE_GAMES_PAGE_STATUS.DENIED,
      denial_reason: permissions.denial_reason,
    });
  return { status: LIVE_GAMES_AUTHORIZATION_STATUS.AUTHORIZED, permissions };
}

function choose_live_games_organization(
  command: LiveGamesPageInitializationCommand,
  organizations: readonly { id: string }[],
): ReturnType<
  typeof load_first_organization_with_fixtures<LiveGamesFixtureState>
> {
  return load_first_organization_with_fixtures(
    list_live_games_organization_candidates(
      organizations,
      select_live_games_organization_id(
        organizations,
        command.search_parameters,
      ),
      command.search_parameters,
    ),
    (organization_id) =>
      refresh_live_games_page_fixture_state_result({
        auth_state: command.auth_state,
        fixture_state_dependencies: command.fixture_state_dependencies,
        organization_id,
      }),
  );
}

async function load_ready_live_games_page(
  command: LiveGamesPageInitializationCommand,
  permissions: LiveGamesPagePermissions,
): Promise<LiveGamesPageInitializationResult> {
  await load_public_live_games_data_when_public(
    command.fixture_state_dependencies,
    command.auth_state,
  );
  const organizations_result = await load_live_games_organizations(
    { organization_use_cases: command.organization_use_cases },
    get_live_games_current_profile_state(command.auth_state),
  );
  if (!organizations_result.success) {
    return {
      status: LIVE_GAMES_PAGE_STATUS.ERROR,
      error_message: organizations_result.error,
    };
  }
  const organizations = organizations_result.data;
  const choice = await choose_live_games_organization(command, organizations);
  const selected_organization_id = choice.organization_id;
  const fixture_state_result = choice.result;
  if (!fixture_state_result.success)
    return {
      status: LIVE_GAMES_PAGE_STATUS.ERROR,
      error_message: fixture_state_result.error,
    };
  const fixture_state = fixture_state_result.data;
  return {
    status: LIVE_GAMES_PAGE_STATUS.READY,
    organizations,
    selected_organization_id,
    can_start_games: permissions.can_start_games,
    permission_info_message: permissions.permission_info_message,
    fixture_state,
  };
}

export async function initialize_live_games_page(
  command: LiveGamesPageInitializationCommand,
): Promise<LiveGamesPageInitializationResult> {
  const authorization = await authorize_live_games_page(command);
  switch (authorization.status) {
    case LIVE_GAMES_AUTHORIZATION_STATUS.NOT_READY:
      return authorization.result;
    case LIVE_GAMES_AUTHORIZATION_STATUS.AUTHORIZED:
      return load_ready_live_games_page(command, authorization.permissions);
  }
}

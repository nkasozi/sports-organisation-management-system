import type { Organization } from "$lib/core/entities/Organization";
import type { AuthState } from "$lib/presentation/stores/auth";

import type {
  LiveGamesAuthorizationAdapter,
  load_live_games_permissions,
} from "./liveGamesAccessLogic";
import type {
  LiveGamesDataDependencies,
  LiveGamesFixtureState,
} from "./liveGamesDataTypes";

export const LIVE_GAMES_PAGE_STATUS = {
  ERROR: "error",
  DENIED: "denied",
  READY: "ready",
} as const;

export interface EnsureAuthProfileResult {
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

export type LiveGamesPageNotReadyResult =
  | {
      status: typeof LIVE_GAMES_PAGE_STATUS.ERROR;
      error_message: string;
    }
  | {
      status: typeof LIVE_GAMES_PAGE_STATUS.DENIED;
      denial_reason: string;
    };

export type LiveGamesPageReadyResult = {
  status: typeof LIVE_GAMES_PAGE_STATUS.READY;
  organizations: Organization[];
  selected_organization_id: string;
  can_start_games: boolean;
  permission_info_message: string;
  fixture_state: LiveGamesFixtureState;
};

export type LiveGamesPageInitializationResult =
  | LiveGamesPageNotReadyResult
  | LiveGamesPageReadyResult;

export type LiveGamesPagePermissions = Awaited<
  ReturnType<typeof load_live_games_permissions>
>;

export const LIVE_GAMES_AUTHORIZATION_STATUS = {
  AUTHORIZED: "authorized",
  NOT_READY: "not_ready",
} as const;

export type LiveGamesPageAuthorizationResult =
  | {
      status: typeof LIVE_GAMES_AUTHORIZATION_STATUS.AUTHORIZED;
      permissions: LiveGamesPagePermissions;
    }
  | {
      status: typeof LIVE_GAMES_AUTHORIZATION_STATUS.NOT_READY;
      result: LiveGamesPageNotReadyResult;
    };

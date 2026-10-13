import type { DataAction, UserScopeProfile } from "$lib/core/interfaces/ports";
import {
  build_profile_management_authorization_filter,
  build_profile_management_permissions,
  type ProfileManagementAuthorizationProfileState,
  type ProfileManagementConfiguration,
  type ProfileManagementPermissions,
} from "$lib/presentation/logic/profileManagementPageState";
import type { AuthState } from "$lib/presentation/stores/authTypes";

import { APP_ROUTE_PATH } from "./layoutRouteConstants";
import { PRESENCE_STATUS } from "./presenceStatus";
import {
  PROFILE_MANAGEMENT_ACCESS_STATUS,
  PROFILE_MANAGEMENT_ACTIONS,
} from "./profileManagementPageConstants";

export const PROFILE_MANAGEMENT_PAGE_MESSAGES = {
  NO_USER_PROFILE: "No user profile found",
  LOAD_FAILED: "Failed to load profiles",
  DELETE_FAILED: "Failed to delete profile",
} as const;

type ProfileManagementAccessOutcome =
  | {
      status: typeof PROFILE_MANAGEMENT_ACCESS_STATUS.FAILED;
      error_message: string;
    }
  | { status: typeof PROFILE_MANAGEMENT_ACCESS_STATUS.DENIED }
  | {
      status: typeof PROFILE_MANAGEMENT_ACCESS_STATUS.GRANTED;
      permissions: ProfileManagementPermissions;
    };

export interface ProfileManagementAccessDependencies {
  ensure_auth_profile: () => Promise<
    { success: true } | { success: false; error_message: string }
  >;
  get_auth_state: () => AuthState;
  check_entity_authorized: (
    raw_token: string,
    entity_type: string,
    action: DataAction,
  ) => Promise<unknown>;
  set_access_denial: (path: string, message: string) => void;
  navigate_home: (route: string) => void;
}

export function build_profile_management_controller_authorization_filter(
  auth_state: AuthState,
  configuration: Pick<
    ProfileManagementConfiguration,
    "authorization_filter_fields"
  >,
): Record<string, string> {
  const current_profile_state = auth_state.current_profile;
  const profile_state: ProfileManagementAuthorizationProfileState =
    current_profile_state.status === PRESENCE_STATUS.PRESENT
      ? {
          status: PRESENCE_STATUS.PRESENT,
          profile: current_profile_state.profile as unknown as UserScopeProfile,
        }
      : { status: PRESENCE_STATUS.MISSING };

  return build_profile_management_authorization_filter(
    profile_state,
    configuration.authorization_filter_fields,
  );
}

async function deny_profile_management_access(
  configuration: Pick<
    ProfileManagementConfiguration,
    "normalized_entity_type" | "access_denial_path" | "access_denial_message"
  >,
  dependencies: ProfileManagementAccessDependencies,
  raw_token: string,
): Promise<ProfileManagementAccessOutcome> {
  await dependencies.check_entity_authorized(
    raw_token,
    configuration.normalized_entity_type,
    PROFILE_MANAGEMENT_ACTIONS.READ,
  );
  dependencies.set_access_denial(
    configuration.access_denial_path,
    configuration.access_denial_message,
  );
  dependencies.navigate_home(APP_ROUTE_PATH.HOME);
  return { status: PROFILE_MANAGEMENT_ACCESS_STATUS.DENIED };
}

export async function resolve_profile_management_access(
  configuration: Pick<
    ProfileManagementConfiguration,
    "normalized_entity_type" | "access_denial_path" | "access_denial_message"
  >,
  dependencies: ProfileManagementAccessDependencies,
): Promise<ProfileManagementAccessOutcome> {
  const ensure_result = await dependencies.ensure_auth_profile();
  if (!ensure_result.success) {
    return {
      status: PROFILE_MANAGEMENT_ACCESS_STATUS.FAILED,
      error_message: ensure_result.error_message,
    };
  }
  const auth_state = dependencies.get_auth_state();
  if (
    auth_state.current_token.status !== PRESENCE_STATUS.PRESENT ||
    auth_state.current_profile.status !== PRESENCE_STATUS.PRESENT
  ) {
    return {
      status: PROFILE_MANAGEMENT_ACCESS_STATUS.FAILED,
      error_message: PROFILE_MANAGEMENT_PAGE_MESSAGES.NO_USER_PROFILE,
    };
  }
  const permissions = build_profile_management_permissions(
    auth_state.current_profile.profile.role,
    configuration.normalized_entity_type,
  );
  if (permissions.can_read) {
    return { status: PROFILE_MANAGEMENT_ACCESS_STATUS.GRANTED, permissions };
  }
  return deny_profile_management_access(
    configuration,
    dependencies,
    auth_state.current_token.token.raw_token,
  );
}

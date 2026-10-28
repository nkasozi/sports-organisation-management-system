import { get_authentication_adapter } from "$lib/adapters/iam/LocalAuthenticationAdapter";
import { get_system_user_repository } from "$lib/adapters/repositories/InBrowserSystemUserRepository";
import type { SidebarMenuGroup } from "$lib/core/interfaces/ports";
import {
  ANY_VALUE,
  type AuthToken,
  type AuthTokenPayloadCore,
  create_auth_token_payload_core,
  type UserRole,
} from "$lib/core/interfaces/ports";
import type { ScalarInput } from "$lib/core/types/DomainScalars";
import type { Result } from "$lib/core/types/Result";
import { get_authorization_adapter } from "$lib/infrastructure/AuthorizationProvider";
import {
  clear_user_context,
  set_user_context,
} from "$lib/infrastructure/events/EventBus";
import { get_sync_manager } from "$lib/infrastructure/sync/convexSyncService";
import { PRESENCE_STATUS } from "$lib/presentation/logic/presenceStatus";

import type { EventBusUserContextState } from "./authHelperContracts";
import {
  AUTH_STORE_LOG_EVENTS,
  AUTH_STORE_MESSAGES,
  CONVEX_CURRENT_USER_PROFILE_QUERY,
  PUBLIC_VIEWER_DISPLAY_NAME,
  PUBLIC_VIEWER_PROFILE_ID,
  PUBLIC_VIEWER_ROLE,
  PUBLIC_VIEWER_TOKEN_EMAIL,
} from "./authStoreConstants";
import type {
  ConvexGetProfileResponse,
  ConvexUserProfile,
  UserProfile,
} from "./authTypes";

export {
  clear_auth_storage,
  load_saved_profile_id,
  load_saved_token,
  save_profile_id,
  save_token,
} from "./authSessionStorage";

const NO_TEAM_SCOPE = "";

function build_auth_token_payload_core_input(
  profile: UserProfile,
): ScalarInput<AuthTokenPayloadCore> {
  if (profile.role === PUBLIC_VIEWER_ROLE) {
    return {
      user_id: profile.id,
      email: PUBLIC_VIEWER_TOKEN_EMAIL,
      display_name: profile.display_name,
      role: profile.role,
      organization_id: ANY_VALUE,
      team_id: ANY_VALUE,
    };
  }

  return {
    user_id: profile.id,
    email: profile.email,
    display_name: profile.display_name,
    role: profile.role,
    organization_id: profile.organization_id,
    team_id: profile.team_id === NO_TEAM_SCOPE ? ANY_VALUE : profile.team_id,
  };
}

export async function fetch_current_user_profile_from_convex(): Promise<
  Result<ConvexUserProfile>
> {
  const convex_client_result = get_sync_manager().get_convex_client();

  if (!convex_client_result.success) {
    return { success: false, error: convex_client_result.error };
  }

  const convex_client = convex_client_result.data;

  try {
    const response = (await convex_client.query(
      CONVEX_CURRENT_USER_PROFILE_QUERY,
      {},
    )) as ConvexGetProfileResponse;

    if (!response.success || !response.data?.email) {
      return {
        success: false,
        error: response.error ?? AUTH_STORE_MESSAGES.CONVEX_PROFILE_NOT_FOUND,
      };
    }

    return { success: true, data: response.data };
  } catch (error) {
    console.warn("[AuthStore] Convex profile query failed", {
      event: AUTH_STORE_LOG_EVENTS.CONVEX_PROFILE_QUERY_FAILED,
      error: error instanceof Error ? error.message : String(error),
    });
    return {
      success: false,
      error: AUTH_STORE_MESSAGES.CONVEX_PROFILE_LOOKUP_FAILED,
    };
  }
}

export function create_public_viewer_profile(): UserProfile {
  return {
    id: PUBLIC_VIEWER_PROFILE_ID as UserProfile["id"],
    display_name: PUBLIC_VIEWER_DISPLAY_NAME as UserProfile["display_name"],
    email: PUBLIC_VIEWER_TOKEN_EMAIL as UserProfile["email"],
    role: PUBLIC_VIEWER_ROLE,
    organization_id: ANY_VALUE as UserProfile["organization_id"],
    organization_name: "",
    team_id: ANY_VALUE as UserProfile["team_id"],
  };
}

export async function generate_token_for_profile(
  profile: UserProfile,
): Promise<Result<AuthToken>> {
  const auth_adapter = get_authentication_adapter(get_system_user_repository());
  const payload_result = create_auth_token_payload_core(
    build_auth_token_payload_core_input(profile),
  );

  if (!payload_result.success) {
    return payload_result;
  }

  const token_result = await auth_adapter.generate_token(payload_result.data);

  if (!token_result.success) {
    console.error("[AuthStore] Failed to generate token", {
      event: AUTH_STORE_LOG_EVENTS.TOKEN_GENERATION_FAILED,
      profile_id: profile.id,
      error: token_result.error,
    });
    return { success: false, error: token_result.error };
  }
  return { success: true, data: token_result.data };
}

export function sync_user_context_with_event_bus(
  context_state: EventBusUserContextState,
): void {
  if (context_state.status !== PRESENCE_STATUS.PRESENT) {
    clear_user_context();
    return;
  }

  const profile = context_state.profile;

  set_user_context({
    user_id: profile.id,
    user_email: profile.email,
    user_display_name: profile.display_name,
    organization_id: profile.organization_id,
  });
}

export async function load_sidebar_menu_for_role(
  role: UserRole,
): Promise<SidebarMenuGroup[]> {
  const adapter = get_authorization_adapter();
  const menu_result = await adapter.get_sidebar_menu_for_role(role);

  if (!menu_result.success) {
    console.error("[AuthStore] Failed to load sidebar menu", {
      event: AUTH_STORE_LOG_EVENTS.SIDEBAR_MENU_LOAD_FAILED,
      role,
      error: menu_result.error,
    });
    return [];
  }
  return menu_result.data;
}

export function build_profiles_with_public_viewer(
  loaded_profiles: UserProfile[],
): UserProfile[] {
  const has_public_viewer = loaded_profiles.some(
    (profile) => profile.id === PUBLIC_VIEWER_PROFILE_ID,
  );
  if (has_public_viewer) return loaded_profiles;
  return [create_public_viewer_profile(), ...loaded_profiles];
}

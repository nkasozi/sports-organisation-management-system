import { get_app_settings_storage } from "$lib/infrastructure/container";
import type { AuthToken, UserRole } from "$lib/core/interfaces/ports";
import type { Result } from "$lib/core/types/Result";
import type { SidebarMenuGroup } from "$lib/core/interfaces/ports";
import {
  set_user_context,
  clear_user_context,
} from "$lib/infrastructure/events/EventBus";
import { get_authentication_adapter } from "$lib/adapters/iam/LocalAuthenticationAdapter";
import { get_system_user_repository } from "$lib/adapters/repositories/InBrowserSystemUserRepository";
import { get_authorization_adapter } from "$lib/infrastructure/AuthorizationProvider";
import { get_sync_manager } from "$lib/infrastructure/sync/convexSyncService";
import type {
  UserProfile,
  ConvexUserProfile,
  ConvexGetProfileResponse,
} from "./authTypes";
import { AUTH_STORAGE_KEY, PROFILE_STORAGE_KEY } from "./authTypes";

export async function fetch_current_user_profile_from_convex(): Promise<
  Result<ConvexUserProfile>
> {
  const convex_client = get_sync_manager().get_convex_client();

  if (!convex_client) {
    return { success: false, error: "Convex client not initialized" };
  }

  try {
    const response = (await convex_client.query(
      "authorization:get_current_user_profile",
      {},
    )) as ConvexGetProfileResponse;

    if (!response.success || !response.data?.email) {
      return {
        success: false,
        error: response.error ?? "Profile not found in Convex",
      };
    }

    return { success: true, data: response.data };
  } catch (error) {
    const error_message =
      error instanceof Error ? error.message : String(error);
    console.warn(`[AuthStore] Convex profile query failed: ${error_message}`);
    return { success: false, error: error_message };
  }
}

export async function load_saved_profile_id(): Promise<string | null> {
  return get_app_settings_storage().get_setting(PROFILE_STORAGE_KEY);
}

export async function save_profile_id(profile_id: string): Promise<void> {
  await get_app_settings_storage().set_setting(PROFILE_STORAGE_KEY, profile_id);
}

export async function load_saved_token(): Promise<string | null> {
  return get_app_settings_storage().get_setting(AUTH_STORAGE_KEY);
}

export async function save_token(raw_token: string): Promise<void> {
  await get_app_settings_storage().set_setting(AUTH_STORAGE_KEY, raw_token);
}

export async function clear_auth_storage(): Promise<void> {
  await get_app_settings_storage().remove_setting(AUTH_STORAGE_KEY);
  await get_app_settings_storage().remove_setting(PROFILE_STORAGE_KEY);
}

export function create_public_viewer_profile(): UserProfile {
  return {
    id: "public-viewer",
    display_name: "Public Viewer",
    email: "",
    role: "public_viewer",
    organization_id: "",
    organization_name: "",
    team_id: "",
  };
}

export async function generate_token_for_profile(
  profile: UserProfile,
): Promise<Result<AuthToken>> {
  const auth_adapter = get_authentication_adapter(get_system_user_repository());
  const token_result = await auth_adapter.generate_token({
    user_id: profile.id,
    email: profile.email,
    display_name: profile.display_name,
    role: profile.role,
    organization_id: profile.organization_id,
    team_id: profile.team_id,
  });

  if (!token_result.success) {
    console.error(
      `[AuthStore] Failed to generate token: ${token_result.error}`,
    );
    return { success: false, error: token_result.error };
  }
  return { success: true, data: token_result.data };
}

export function sync_user_context_with_event_bus(
  profile: UserProfile | null,
): void {
  if (!profile) {
    clear_user_context();
    return;
  }
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
    console.error(
      `[AuthStore] Failed to load sidebar menu: ${menu_result.error}`,
    );
    return [];
  }
  return menu_result.data;
}

export function build_profiles_with_public_viewer(
  loaded_profiles: UserProfile[],
): UserProfile[] {
  const has_public_viewer = loaded_profiles.some(
    (p) => p.id === "public-viewer",
  );
  if (has_public_viewer) return loaded_profiles;
  return [create_public_viewer_profile(), ...loaded_profiles];
}

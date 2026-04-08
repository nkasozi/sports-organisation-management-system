import { get, writable } from "svelte/store";

import { sync_branding_with_profile } from "$lib/adapters/initialization/brandingSyncService";
import { get_organization_repository } from "$lib/adapters/repositories/InBrowserOrganizationRepository";
import { get_system_user_repository } from "$lib/adapters/repositories/InBrowserSystemUserRepository";
import { get_team_repository } from "$lib/adapters/repositories/InBrowserTeamRepository";
import type { Result } from "$lib/core/types/Result";

import {
  build_profiles_with_public_viewer,
  clear_auth_storage,
  generate_token_for_profile,
  load_sidebar_menu_for_role,
  save_profile_id,
  save_token,
  sync_user_context_with_event_bus,
} from "./authHelpers";
import { execute_auth_initialization } from "./authInitialize";
import {
  compute_authorization_level,
  compute_disabled_functionalities,
  compute_feature_access,
  compute_is_authorized_to_execute,
  compute_is_functionality_disabled,
} from "./authPermissions";
import type { AuthState } from "./authTypes";
import { load_profiles_from_repository } from "./profileLoader";

function create_auth_store() {
  const initial_state: AuthState = {
    current_token: null,
    current_profile: null,
    available_profiles: [],
    sidebar_menu_items: [],
    is_initialized: false,
    is_demo_session: false,
  };

  const { subscribe, set, update } = writable<AuthState>(initial_state);

  async function initialize(): Promise<Result<true>> {
    return execute_auth_initialization(get({ subscribe }), set);
  }

  async function refresh_profiles(): Promise<boolean> {
    console.debug("[AuthStore] Starting profile refresh");
    const repository = get_system_user_repository();
    const organization_repository = get_organization_repository();
    const loaded_profiles = await load_profiles_from_repository(
      repository,
      organization_repository,
      get_team_repository(),
    );
    const refreshed_profiles =
      build_profiles_with_public_viewer(loaded_profiles);

    const state = get({ subscribe });
    const previous_count = state.available_profiles.length;
    const current_profile_still_exists = state.current_profile
      ? refreshed_profiles.some((p) => p.id === state.current_profile!.id)
      : false;

    update((s) => ({
      ...s,
      available_profiles: refreshed_profiles,
      current_profile: current_profile_still_exists
        ? refreshed_profiles.find((p) => p.id === s.current_profile!.id)!
        : s.current_profile,
    }));

    console.debug(
      `[AuthStore] Refreshed profiles: ${previous_count} -> ${refreshed_profiles.length} available`,
    );
    return true;
  }

  async function switch_profile(profile_id: string): Promise<boolean> {
    const state = get({ subscribe });
    const target_profile = state.available_profiles.find(
      (p) => p.id === profile_id,
    );

    if (!target_profile) {
      console.error(`[AuthStore] Profile not found: ${profile_id}`);
      return false;
    }

    const token_result = await generate_token_for_profile(target_profile);
    if (!token_result.success) {
      console.error(
        `[AuthStore] Failed to switch profile: ${token_result.error}`,
      );
      return false;
    }
    const new_token = token_result.data;
    await save_token(new_token.raw_token);
    await save_profile_id(target_profile.id);
    sync_user_context_with_event_bus(target_profile);
    const sidebar = await load_sidebar_menu_for_role(target_profile.role);

    update((s) => ({
      ...s,
      current_token: new_token,
      current_profile: target_profile,
      sidebar_menu_items: sidebar,
    }));
    await sync_branding_with_profile(target_profile);
    console.log(
      `[AuthStore] Switched to profile: ${target_profile.display_name}`,
    );
    return true;
  }

  async function logout(): Promise<void> {
    await clear_auth_storage();
    sync_user_context_with_event_bus(null);
    set({
      current_token: null,
      current_profile: null,
      available_profiles: [],
      sidebar_menu_items: [],
      is_initialized: false,
      is_demo_session: false,
    });
    console.log("[AuthStore] Logged out");
  }

  return {
    subscribe,
    initialize,
    switch_profile,
    refresh_profiles,
    get_current_role: () => get({ subscribe }).current_profile?.role || null,
    logout,
    reset_initialized_state: (): void => {
      update((s) => ({ ...s, is_initialized: false, is_demo_session: false }));
    },
    mark_as_demo_session: (): boolean => {
      update((s) => ({ ...s, is_demo_session: true }));
      return true;
    },
    get_sidebar_menu_items: () => get({ subscribe }).sidebar_menu_items,
    get_authorization_level: (entity_type: string) =>
      compute_authorization_level(get({ subscribe }), entity_type),
    is_authorized_to_execute: (
      action: string,
      entity_type: string,
      _entity_id?: string,
      _target_org_id?: string,
      _target_team_id?: string,
    ) =>
      compute_is_authorized_to_execute(
        get({ subscribe }),
        action as any,
        entity_type,
      ),
    get_feature_access: () => compute_feature_access(get({ subscribe })),
    is_functionality_disabled: (action: string, entity_type: string) =>
      compute_is_functionality_disabled(
        get({ subscribe }),
        action as any,
        entity_type,
      ),
    get_disabled_functionalities: (entity_type: string) =>
      compute_disabled_functionalities(get({ subscribe }), entity_type),
  };
}

export const auth_store = create_auth_store();

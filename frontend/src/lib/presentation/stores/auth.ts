import { writable, derived, get } from "svelte/store";
import { browser } from "$app/environment";
import type {
  AuthToken,
  AuthTokenPayload,
  UserRole,
  Permission,
} from "$lib/core/interfaces/ports/AuthenticationPort";
import {
  USER_ROLE_DISPLAY_NAMES,
  USER_ROLE_ORDER,
  ROLE_PERMISSIONS,
  ANY_VALUE,
} from "$lib/core/interfaces/ports/AuthenticationPort";
import { get_authentication_adapter } from "$lib/adapters/services/LocalAuthenticationAdapter";
import type {
  AuthorizableAction,
  AuthorizationCheckResult,
  EntityAuthorizationMap,
  FeatureAccess,
  SidebarMenuGroup,
} from "$lib/core/interfaces/ports/AuthorizationPort";
import { get_authorization_adapter } from "$lib/adapters/services/LocalAuthorizationAdapter";
import {
  SEED_ORGANIZATION_IDS,
  SEED_TEAM_IDS,
  SEED_PLAYER_IDS,
  SEED_OFFICIAL_IDS,
} from "$lib/infrastructure/utils/SeedDataGenerator";

export interface UserProfile {
  id: string;
  display_name: string;
  email: string;
  role: UserRole;
  organization_id: string;
  team_id: string;
  player_id?: string;
  official_id?: string;
}

interface AuthState {
  current_token: AuthToken | null;
  current_profile: UserProfile | null;
  available_profiles: UserProfile[];
  is_initialized: boolean;
}

const AUTH_STORAGE_KEY = "sports-org-auth-token";
const PROFILE_STORAGE_KEY = "sports-org-current-profile-id";

function create_default_profiles(): UserProfile[] {
  return [
    {
      id: "super-admin-profile",
      display_name: "Super Admin",
      email: "superadmin@sportsorg.local",
      role: "super_admin",
      organization_id: ANY_VALUE,
      team_id: ANY_VALUE,
    },
    {
      id: "org-admin-profile",
      display_name: "Organisation Admin (Uganda Hockey)",
      email: "orgadmin@ugandahockey.local",
      role: "org_admin",
      organization_id: SEED_ORGANIZATION_IDS.UGANDA_HOCKEY_ASSOCIATION,
      team_id: ANY_VALUE,
    },
    {
      id: "officials-manager-profile",
      display_name: "Officials Manager (Uganda Hockey)",
      email: "officials@ugandahockey.local",
      role: "officials_manager",
      organization_id: SEED_ORGANIZATION_IDS.UGANDA_HOCKEY_ASSOCIATION,
      team_id: ANY_VALUE,
    },
    {
      id: "team-manager-profile",
      display_name: "Team Manager (Weatherhead HC)",
      email: "manager@weatherheadhc.local",
      role: "team_manager",
      organization_id: SEED_ORGANIZATION_IDS.UGANDA_HOCKEY_ASSOCIATION,
      team_id: SEED_TEAM_IDS.WEATHERHEAD_HC,
    },
    {
      id: "official-profile",
      display_name: "Michael Anderson (Official)",
      email: "michael.anderson@ugandahockey.local",
      role: "official",
      organization_id: SEED_ORGANIZATION_IDS.UGANDA_HOCKEY_ASSOCIATION,
      team_id: ANY_VALUE,
      official_id: SEED_OFFICIAL_IDS.MICHAEL_ANDERSON,
    },
    {
      id: "player-profile",
      display_name: "Denis Onyango (Player)",
      email: "denis.onyango@weatherheadhc.local",
      role: "player",
      organization_id: SEED_ORGANIZATION_IDS.UGANDA_HOCKEY_ASSOCIATION,
      team_id: SEED_TEAM_IDS.WEATHERHEAD_HC,
      player_id: SEED_PLAYER_IDS.DENIS_ONYANGO,
    },
  ];
}

function load_saved_profile_id(): string | null {
  if (!browser) return null;
  return localStorage.getItem(PROFILE_STORAGE_KEY);
}

function save_profile_id(profile_id: string): void {
  if (!browser) return;
  localStorage.setItem(PROFILE_STORAGE_KEY, profile_id);
}

function load_saved_token(): string | null {
  if (!browser) return null;
  return localStorage.getItem(AUTH_STORAGE_KEY);
}

function save_token(raw_token: string): void {
  if (!browser) return;
  localStorage.setItem(AUTH_STORAGE_KEY, raw_token);
}

function clear_auth_storage(): void {
  if (!browser) return;
  localStorage.removeItem(AUTH_STORAGE_KEY);
  localStorage.removeItem(PROFILE_STORAGE_KEY);
}

function create_auth_store() {
  const initial_state: AuthState = {
    current_token: null,
    current_profile: null,
    available_profiles: create_default_profiles(),
    is_initialized: false,
  };

  const { subscribe, set, update } = writable<AuthState>(initial_state);

  async function generate_token_for_profile(
    profile: UserProfile,
  ): Promise<AuthToken> {
    const auth_adapter = get_authentication_adapter();
    const permissions = ROLE_PERMISSIONS[profile.role];

    return auth_adapter.generate_token({
      user_id: profile.id,
      email: profile.email,
      display_name: profile.display_name,
      role: profile.role,
      organization_id: profile.organization_id,
      team_id: profile.team_id,
      permissions,
    });
  }

  async function initialize(): Promise<void> {
    const available_profiles = create_default_profiles();
    const saved_profile_id = load_saved_profile_id();
    const saved_token_raw = load_saved_token();

    let current_profile: UserProfile | null = null;
    let current_token: AuthToken | null = null;

    if (saved_token_raw) {
      const auth_adapter = get_authentication_adapter();
      const verification_result =
        await auth_adapter.verify_token(saved_token_raw);

      if (verification_result.is_valid && verification_result.payload) {
        current_profile =
          available_profiles.find(
            (p) => p.id === verification_result.payload?.user_id,
          ) || null;

        if (current_profile) {
          current_token = {
            payload: verification_result.payload,
            signature: saved_token_raw.split(".")[2],
            raw_token: saved_token_raw,
          };
          console.log(
            `[AuthStore] Restored session for profile: ${current_profile.display_name}`,
          );
        }
      } else {
        console.warn(
          "[AuthStore] Saved token is invalid or expired, clearing storage",
        );
        clear_auth_storage();
      }
    }

    if (!current_profile) {
      const default_profile_id = saved_profile_id || "super-admin-profile";
      current_profile =
        available_profiles.find((p) => p.id === default_profile_id) ||
        available_profiles[0];
      current_token = await generate_token_for_profile(current_profile);
      save_token(current_token.raw_token);
      save_profile_id(current_profile.id);
      console.log(
        `[AuthStore] Initialized with default profile: ${current_profile.display_name}`,
      );
    }

    set({
      current_token,
      current_profile,
      available_profiles,
      is_initialized: true,
    });
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

    const new_token = await generate_token_for_profile(target_profile);
    save_token(new_token.raw_token);
    save_profile_id(target_profile.id);

    update((s) => ({
      ...s,
      current_token: new_token,
      current_profile: target_profile,
    }));

    console.log(
      `[AuthStore] Switched to profile: ${target_profile.display_name}`,
    );
    return true;
  }

  function has_permission(permission: Permission): boolean {
    const state = get({ subscribe });
    if (!state.current_token) return false;
    return state.current_token.payload.permissions.includes(permission);
  }

  function get_current_role(): UserRole | null {
    const state = get({ subscribe });
    return state.current_profile?.role || null;
  }

  function logout(): void {
    clear_auth_storage();
    set({
      current_token: null,
      current_profile: null,
      available_profiles: create_default_profiles(),
      is_initialized: false,
    });
    console.log("[AuthStore] Logged out");
  }

  function get_sidebar_menu_items(): SidebarMenuGroup[] {
    const state = get({ subscribe });
    if (!state.current_token) {
      console.warn("[AuthStore] No token available for sidebar menu items");
      return [];
    }
    const authorization_adapter = get_authorization_adapter();
    return authorization_adapter.get_sidebar_menu_items(state.current_token);
  }

  function get_authorization_level(
    entity_type: string,
  ): EntityAuthorizationMap {
    const state = get({ subscribe });
    if (!state.current_token) {
      console.warn(
        "[AuthStore] No token available for authorization level check",
      );
      return {
        entity_type,
        authorizations: new Map(),
      };
    }
    const authorization_adapter = get_authorization_adapter();
    return authorization_adapter.get_user_authorization_level(
      state.current_token,
      entity_type,
    );
  }

  function is_authorized_to_execute(
    action: AuthorizableAction,
    entity_type: string,
    entity_id?: string,
    target_organization_id?: string,
    target_team_id?: string,
  ): AuthorizationCheckResult {
    const state = get({ subscribe });
    if (!state.current_token) {
      console.warn("[AuthStore] No token available for authorization check");
      return {
        is_authorized: false,
        authorization_level: "none",
        error_message: "No authentication token available",
      };
    }
    const authorization_adapter = get_authorization_adapter();
    return authorization_adapter.is_authorized_to_execute(
      state.current_token,
      action,
      entity_type,
      entity_id,
      target_organization_id,
      target_team_id,
    );
  }

  function get_feature_access(): FeatureAccess {
    const state = get({ subscribe });
    if (!state.current_token) {
      console.warn("[AuthStore] No token available for feature access");
      return {
        can_reset_demo: false,
        can_view_audit_logs: false,
        can_access_dashboard: false,
        audit_logs_scope: "none",
      };
    }
    const authorization_adapter = get_authorization_adapter();
    return authorization_adapter.get_feature_access(state.current_token);
  }

  function is_functionality_disabled(
    action: AuthorizableAction,
    entity_type: string,
  ): boolean {
    const auth_result = is_authorized_to_execute(action, entity_type);
    return !auth_result.is_authorized;
  }

  function get_disabled_functionalities(
    entity_type: string,
  ): AuthorizableAction[] {
    const actions: AuthorizableAction[] = [
      "create",
      "edit",
      "delete",
      "list",
      "view",
    ];
    return actions.filter((action) =>
      is_functionality_disabled(action, entity_type),
    );
  }

  return {
    subscribe,
    initialize,
    switch_profile,
    has_permission,
    get_current_role,
    logout,
    get_sidebar_menu_items,
    get_authorization_level,
    is_authorized_to_execute,
    get_feature_access,
    is_functionality_disabled,
    get_disabled_functionalities,
  };
}

export const auth_store = create_auth_store();

export const current_auth_token = derived(
  auth_store,
  ($auth) => $auth.current_token,
);

export const current_user_role = derived(
  auth_store,
  ($auth) => $auth.current_profile?.role || null,
);

export const current_user_role_display = derived(auth_store, ($auth) => {
  const role = $auth.current_profile?.role;
  return role ? USER_ROLE_DISPLAY_NAMES[role] : "Unknown";
});

export const available_profiles = derived(
  auth_store,
  ($auth) => $auth.available_profiles,
);

export const other_available_profiles = derived(auth_store, ($auth) => {
  const current_id = $auth.current_profile?.id;
  return $auth.available_profiles.filter((p) => p.id !== current_id);
});

export const is_auth_initialized = derived(
  auth_store,
  ($auth) => $auth.is_initialized,
);

export const current_permissions = derived(auth_store, ($auth) => {
  return $auth.current_token?.payload.permissions || [];
});

export function check_permission(permission: Permission): boolean {
  return auth_store.has_permission(permission);
}

export const sidebar_menu_items = derived(auth_store, ($auth) => {
  if (!$auth.is_initialized || !$auth.current_token) {
    return [];
  }
  const authorization_adapter = get_authorization_adapter();
  return authorization_adapter.get_sidebar_menu_items($auth.current_token);
});

export const feature_access = derived(auth_store, ($auth) => {
  if (!$auth.is_initialized || !$auth.current_token) {
    return {
      can_reset_demo: false,
      can_view_audit_logs: false,
      can_access_dashboard: false,
      audit_logs_scope: "none" as const,
    };
  }
  const authorization_adapter = get_authorization_adapter();
  return authorization_adapter.get_feature_access($auth.current_token);
});

export function get_entity_authorization_level(
  entity_type: string,
): EntityAuthorizationMap {
  return auth_store.get_authorization_level(entity_type);
}

export function check_action_authorization(
  action: AuthorizableAction,
  entity_type: string,
  entity_id?: string,
  target_organization_id?: string,
  target_team_id?: string,
): AuthorizationCheckResult {
  return auth_store.is_authorized_to_execute(
    action,
    entity_type,
    entity_id,
    target_organization_id,
    target_team_id,
  );
}

export function get_disabled_crud_actions(
  entity_type: string,
): AuthorizableAction[] {
  return auth_store.get_disabled_functionalities(entity_type);
}

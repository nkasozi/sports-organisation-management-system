import { writable, derived, get } from "svelte/store";
import { browser } from "$app/environment";
import type {
  AuthToken,
  AuthTokenPayload,
  UserRole,
} from "$lib/core/interfaces/ports";
import type { Result } from "$lib/core/types/Result";
import {
  create_success_result,
  create_failure_result,
} from "$lib/core/types/Result";
import {
  set_user_context,
  clear_user_context,
} from "$lib/infrastructure/events/EventBus";
import {
  USER_ROLE_DISPLAY_NAMES,
  USER_ROLE_ORDER,
} from "$lib/core/interfaces/ports";
import { get_authentication_adapter } from "$lib/adapters/iam/LocalAuthenticationAdapter";
import { get_system_user_repository } from "$lib/adapters/repositories/InBrowserSystemUserRepository";
import { get_organization_repository } from "$lib/adapters/repositories/InBrowserOrganizationRepository";
import type {
  SidebarMenuGroup,
  DataAction,
  DataCategory,
  CategoryPermissions,
  AuthorizableAction,
  AuthorizationLevel,
  EntityAuthorizationMap,
  AuthorizationCheckResult,
  FeatureAccess,
} from "$lib/core/interfaces/ports";
import { get_authorization_adapter } from "$lib/infrastructure/AuthorizationProvider";
import { sync_branding_with_profile } from "$lib/adapters/initialization/brandingSyncService";
import { load_profiles_from_repository } from "./profileLoader";
import {
  is_signed_in,
  is_clerk_loaded,
  clerk_session,
} from "$lib/adapters/iam/clerkAuthService";
import {
  SHARED_ENTITY_CATEGORY_MAP,
  SHARED_ROLE_PERMISSIONS,
} from "$convex/shared_permission_definitions";
import type {
  SharedEntityType,
  SharedCrudPermissions,
} from "$convex/shared_permission_definitions";
import { normalize_to_entity_type } from "$lib/core/interfaces/ports/external/iam/AuthorizationPort";
import {
  get_sync_manager,
  write_convex_user_to_local_dexie,
} from "$lib/infrastructure/sync/convexSyncService";

interface ConvexUserProfile {
  local_id?: string;
  email: string;
  first_name?: string;
  last_name?: string;
  name?: string;
  role: string;
  organization_id?: string;
  team_id?: string;
  player_id?: string;
  official_id?: string;
  status?: string;
}

interface ConvexGetProfileResponse {
  success: boolean;
  data?: ConvexUserProfile;
  error?: string;
}

async function fetch_current_user_profile_from_convex(): Promise<Result<ConvexUserProfile>> {
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
      return { success: false, error: response.error ?? "Profile not found in Convex" };
    }

    return { success: true, data: response.data };
  } catch (error) {
    const error_message = error instanceof Error ? error.message : String(error);
    console.warn(`[AuthStore] Convex profile query failed: ${error_message}`);
    return { success: false, error: error_message };
  }
}

function get_entity_data_category(entity_type: SharedEntityType): DataCategory {
  return SHARED_ENTITY_CATEGORY_MAP[entity_type] || "organisation_level";
}

function check_entity_permission(
  role: UserRole,
  entity_type: SharedEntityType,
  action: DataAction,
  permissions: Record<DataCategory, CategoryPermissions>,
): boolean {
  const category = get_entity_data_category(entity_type);
  const category_permissions = permissions[category];
  return category_permissions[action];
}

function adapt_shared_permissions(
  shared: SharedCrudPermissions,
): CategoryPermissions {
  return {
    create: shared.can_create,
    read: shared.can_read,
    update: shared.can_update,
    delete: shared.can_delete,
  };
}

function get_role_permissions_sync(
  role: UserRole,
): Result<Record<DataCategory, CategoryPermissions>> {
  const shared_perms = SHARED_ROLE_PERMISSIONS[role];
  if (!shared_perms) {
    console.error(`[AuthStore] Unknown role: "${role}" — this should never happen`);
    return { success: false, error: `Unknown role: "${role}"` };
  }
  return {
    success: true,
    data: {
      root_level: adapt_shared_permissions(shared_perms.root_level),
      org_administrator_level: adapt_shared_permissions(
        shared_perms.org_administrator_level,
      ),
      organisation_level: adapt_shared_permissions(shared_perms.organisation_level),
      team_level: adapt_shared_permissions(shared_perms.team_level),
      player_level: adapt_shared_permissions(shared_perms.player_level),
      public_level: adapt_shared_permissions(shared_perms.public_level),
    },
  };
}

export interface UserProfile {
  id: string;
  display_name: string;
  email: string;
  role: UserRole;
  organization_id: string;
  organization_name: string;
  team_id: string;
  player_id?: string;
  official_id?: string;
}

interface AuthState {
  current_token: AuthToken | null;
  current_profile: UserProfile | null;
  available_profiles: UserProfile[];
  sidebar_menu_items: SidebarMenuGroup[];
  is_initialized: boolean;
}

const AUTH_STORAGE_KEY = "sports-org-auth-token";
const PROFILE_STORAGE_KEY = "sports-org-current-profile-id";

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

function create_public_viewer_profile(): UserProfile {
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

function create_auth_store() {
  const initial_state: AuthState = {
    current_token: null,
    current_profile: null,
    available_profiles: [],
    sidebar_menu_items: [],
    is_initialized: false,
  };

  const { subscribe, set, update } = writable<AuthState>(initial_state);

  async function generate_token_for_profile(
    profile: UserProfile,
  ): Promise<Result<AuthToken>> {
    const auth_adapter = get_authentication_adapter(
      get_system_user_repository(),
    );

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

  function sync_user_context_with_event_bus(profile: UserProfile | null): void {
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

  async function load_sidebar_menu_for_role(
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

  function build_profiles_with_public_viewer(
    loaded_profiles: UserProfile[],
  ): UserProfile[] {
    const has_public_viewer = loaded_profiles.some(
      (p) => p.id === "public-viewer",
    );
    if (has_public_viewer) return loaded_profiles;
    return [create_public_viewer_profile(), ...loaded_profiles];
  }

  async function initialize(): Promise<Result<true>> {
    const current_state = get({ subscribe });
    if (current_state.is_initialized) return create_success_result(true);

    const clerk_already_loaded = get(is_clerk_loaded);
    if (!clerk_already_loaded) {
      console.log(
        "[AuthStore] Waiting for Clerk to load before initializing...",
      );
      await new Promise<void>((resolve) => {
        const unsub = is_clerk_loaded.subscribe((loaded) => {
          if (!loaded) return;
          unsub();
          resolve();
        });
      });
    }

    const repository = get_system_user_repository();
    const organization_repository = get_organization_repository();
    const loaded_profiles = await load_profiles_from_repository(
      repository,
      organization_repository,
    );
    const available_profiles =
      build_profiles_with_public_viewer(loaded_profiles);
    const saved_token_raw = load_saved_token();
    const user_is_signed_in = get(is_signed_in);

    let current_profile: UserProfile | null = null;
    let current_token: AuthToken | null = null;

    if (!user_is_signed_in) {
      console.log(
        "[AuthStore] User not signed in, defaulting to public viewer",
      );
      const public_profile = available_profiles.find(
        (p) => p.id === "public-viewer",
      )!;
      const sidebar_menu_items =
        await load_sidebar_menu_for_role("public_viewer");
      set({
        current_token: null,
        current_profile: public_profile,
        available_profiles,
        sidebar_menu_items,
        is_initialized: true,
      });
      return create_success_result(true);
    }

    const clerk_state = get(clerk_session);
    const clerk_email = clerk_state.user?.email_address?.toLowerCase() ?? null;

    const convex_email_result = await fetch_current_user_profile_from_convex();

    const clerk_matched_profile = convex_email_result.success
      ? (available_profiles.find(
          (p) => p.email.toLowerCase() === convex_email_result.data.email.toLowerCase(),
        ) ?? null)
      : null;

    if (!convex_email_result.success) {
      console.warn(
        `[AuthStore] Convex unavailable during profile lookup: ${convex_email_result.error}`,
      );
    } else if (!clerk_matched_profile) {
      console.warn(
        `[AuthStore] No local profile found matching Convex email: ${convex_email_result.data.email}. ` +
          "Writing user from Convex directly to local Dexie...",
      );
    }

    if (saved_token_raw) {
      const auth_adapter = get_authentication_adapter(
        get_system_user_repository(),
      );
      const verify_result = await auth_adapter.verify_token(saved_token_raw);

      if (
        verify_result.success &&
        verify_result.data.is_valid &&
        verify_result.data.payload
      ) {
        const verification = verify_result.data;
        const token_profile =
          available_profiles.find(
            (p) => p.id === verification.payload?.user_id,
          ) ?? null;

        const token_matches_clerk_user =
          clerk_email === null ||
          (token_profile !== null &&
            token_profile.email.toLowerCase() === clerk_email);

        if (token_profile && token_matches_clerk_user && verification.payload) {
          current_profile = token_profile;
          current_token = {
            payload: verification.payload,
            signature: saved_token_raw.split(".")[2],
            raw_token: saved_token_raw,
          };
          console.log(
            `[AuthStore] Restored session for profile: ${current_profile.display_name}`,
          );
        } else {
          console.warn(
            `[AuthStore] Saved token belongs to a different user ` +
              `(token: ${token_profile?.email ?? "unknown"}, clerk: ${clerk_email}). ` +
              "Clearing stale token.",
          );
          clear_auth_storage();
        }
      } else {
        console.warn(
          "[AuthStore] Saved token is invalid or expired, clearing storage",
        );
        clear_auth_storage();
      }
    }

    if (!current_profile) {
      let resolved_profile = clerk_matched_profile;

      if (!resolved_profile && convex_email_result.success) {
        console.log(
          `[AuthStore] User ${convex_email_result.data.email} not found locally — writing Convex user directly to Dexie...`,
        );
        await write_convex_user_to_local_dexie(convex_email_result.data);

        const refreshed_profiles_raw = await load_profiles_from_repository(
          repository,
          organization_repository,
        );
        const refreshed_available_profiles =
          build_profiles_with_public_viewer(refreshed_profiles_raw);
        resolved_profile =
          refreshed_available_profiles.find(
            (p) =>
              p.email.toLowerCase() ===
              convex_email_result.data.email.toLowerCase(),
          ) ?? null;

        if (resolved_profile) {
          console.log(
            `[AuthStore] Profile created from Convex data: ${resolved_profile.display_name}`,
          );
        }
      }

      if (!resolved_profile) {
        const failure_reason = !convex_email_result.success
          ? `Convex unavailable: ${convex_email_result.error}`
          : `no local profile found for Convex email: ${convex_email_result.data.email} — user may not exist in the system`;
        console.error(`[AuthStore] Cannot initialize: ${failure_reason}.`);
        return create_failure_result(failure_reason);
      }

      current_profile = resolved_profile;

      const token_result = await generate_token_for_profile(current_profile);
      if (!token_result.success) {
        console.error(
          `[AuthStore] Failed to generate token: ${token_result.error}`,
        );
        return create_failure_result(token_result.error);
      }
      current_token = token_result.data;
      save_token(current_token.raw_token);
      save_profile_id(current_profile.id);
      console.log(
        `[AuthStore] Initialized with profile: ${current_profile.display_name} (role: ${current_profile.role})`,
      );
    }

    sync_user_context_with_event_bus(current_profile);

    const sidebar_menu_items = await load_sidebar_menu_for_role(
      current_profile.role,
    );

    set({
      current_token,
      current_profile,
      available_profiles,
      sidebar_menu_items,
      is_initialized: true,
    });

    await sync_branding_with_profile(current_profile);
    return create_success_result(true);
  }

  async function refresh_profiles(): Promise<boolean> {
    console.debug("[AuthStore] Starting profile refresh");
    const repository = get_system_user_repository();
    const organization_repository = get_organization_repository();
    const loaded_profiles = await load_profiles_from_repository(
      repository,
      organization_repository,
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
    save_token(new_token.raw_token);
    save_profile_id(target_profile.id);

    sync_user_context_with_event_bus(target_profile);

    const sidebar_menu_items = await load_sidebar_menu_for_role(
      target_profile.role,
    );

    update((s) => ({
      ...s,
      current_token: new_token,
      current_profile: target_profile,
      sidebar_menu_items,
    }));

    await sync_branding_with_profile(target_profile);

    console.log(
      `[AuthStore] Switched to profile: ${target_profile.display_name}`,
    );
    return true;
  }

  function get_current_role(): UserRole | null {
    const state = get({ subscribe });
    return state.current_profile?.role || null;
  }

  function logout(): void {
    clear_auth_storage();
    clear_user_context();
    set({
      current_token: null,
      current_profile: null,
      available_profiles: [],
      sidebar_menu_items: [],
      is_initialized: false,
    });
    console.log("[AuthStore] Logged out");
  }

  function get_sidebar_menu_items(): SidebarMenuGroup[] {
    const state = get({ subscribe });
    return state.sidebar_menu_items;
  }

  function get_authorization_level(
    entity_type: string,
  ): EntityAuthorizationMap {
    const state = get({ subscribe });
    if (!state.current_profile) {
      console.warn(
        "[AuthStore] No profile available for authorization level check",
      );
      return {
        entity_type,
        authorizations: new Map(),
      };
    }

    const role = state.current_profile.role;
    const permissions_result = get_role_permissions_sync(role);
    if (!permissions_result.success) {
      console.error(`[AuthStore] ${permissions_result.error}`);
      return { entity_type, authorizations: new Map() };
    }
    const permissions = permissions_result.data;
    const authorizations = new Map<AuthorizableAction, AuthorizationLevel>();

    const normalized = normalize_to_entity_type(entity_type);
    const category = get_entity_data_category(normalized);
    const category_perms = permissions[category];

    authorizations.set("view", category_perms.read ? "full" : "none");
    authorizations.set("list", category_perms.read ? "full" : "none");
    authorizations.set("create", category_perms.create ? "full" : "none");
    authorizations.set("edit", category_perms.update ? "full" : "none");
    authorizations.set("delete", category_perms.delete ? "full" : "none");

    return {
      entity_type,
      authorizations,
    };
  }

  function is_authorized_to_execute(
    action: AuthorizableAction,
    entity_type: string,
    _entity_id?: string,
    _target_organization_id?: string,
    _target_team_id?: string,
  ): AuthorizationCheckResult {
    const state = get({ subscribe });
    if (!state.current_profile) {
      console.warn("[AuthStore] No profile available for authorization check");
      return {
        is_authorized: false,
        authorization_level: "none",
        error_message: "No authentication profile available",
      };
    }

    const role = state.current_profile.role;
    const permissions_result = get_role_permissions_sync(role);
    if (!permissions_result.success) {
      console.error(`[AuthStore] ${permissions_result.error}`);
      return { is_authorized: false, authorization_level: "none", error_message: permissions_result.error };
    }
    const permissions = permissions_result.data;
    const data_action = map_authorizable_action_to_data_action(action);

    if (!data_action) {
      return {
        is_authorized: true,
        authorization_level: "full",
      };
    }

    const normalized = normalize_to_entity_type(entity_type);
    const is_authorized = check_entity_permission(
      role,
      normalized,
      data_action,
      permissions,
    );

    return {
      is_authorized,
      authorization_level: is_authorized ? "full" : "none",
      error_message: is_authorized
        ? undefined
        : `Role "${role}" does not have "${action}" permission for "${entity_type}"`,
    };
  }

  function get_feature_access(): FeatureAccess {
    const state = get({ subscribe });
    if (!state.current_profile) {
      console.warn("[AuthStore] No profile available for feature access");
      return {
        can_reset_demo: false,
        can_view_audit_logs: false,
        can_access_dashboard: false,
        can_switch_profiles: false,
        audit_logs_scope: "none",
      };
    }

    const role = state.current_profile.role;
    const is_super_admin = role === "super_admin";
    const is_org_admin = role === "org_admin";

    const is_not_signed_in = role === "public_viewer";

    return {
      can_reset_demo: is_super_admin,
      can_view_audit_logs: is_super_admin || is_org_admin,
      can_access_dashboard: true,
      can_switch_profiles: is_super_admin || is_not_signed_in,
      audit_logs_scope: is_super_admin
        ? "all"
        : is_org_admin
          ? "organization"
          : "none",
    };
  }

  function is_functionality_disabled(
    action: AuthorizableAction,
    entity_type: string,
  ): boolean {
    const state = get({ subscribe });
    if (!state.current_profile) return true;

    const data_action = map_authorizable_action_to_data_action(action);
    if (!data_action) return false;

    const normalized = normalize_to_entity_type(entity_type);
    const permissions_result = get_role_permissions_sync(state.current_profile.role);
    if (!permissions_result.success) {
      console.error(`[AuthStore] ${permissions_result.error}`);
      return true;
    }
    return !check_entity_permission(
      state.current_profile.role,
      normalized,
      data_action,
      permissions_result.data,
    );
  }

  function map_authorizable_action_to_data_action(
    action: AuthorizableAction,
  ): DataAction | null {
    switch (action) {
      case "create":
        return "create";
      case "edit":
        return "update";
      case "delete":
        return "delete";
      case "list":
      case "view":
        return "read";
      default:
        return null;
    }
  }

  function get_disabled_functionalities(
    entity_type: string,
  ): AuthorizableAction[] {
    const state = get({ subscribe });
    if (!state.current_profile) {
      return ["create", "edit", "delete", "list", "view"];
    }

    const normalized = normalize_to_entity_type(entity_type);
    const permissions_result = get_role_permissions_sync(state.current_profile.role);
    if (!permissions_result.success) {
      console.error(`[AuthStore] ${permissions_result.error}`);
      return ["create", "edit", "delete", "list", "view"];
    }
    const permissions = permissions_result.data;
    const disabled_actions: AuthorizableAction[] = [];

    if (
      !check_entity_permission(
        state.current_profile.role,
        normalized,
        "create",
        permissions,
      )
    ) {
      disabled_actions.push("create");
    }
    if (
      !check_entity_permission(
        state.current_profile.role,
        normalized,
        "update",
        permissions,
      )
    ) {
      disabled_actions.push("edit");
    }
    if (
      !check_entity_permission(
        state.current_profile.role,
        normalized,
        "delete",
        permissions,
      )
    ) {
      disabled_actions.push("delete");
    }
    if (
      !check_entity_permission(
        state.current_profile.role,
        normalized,
        "read",
        permissions,
      )
    ) {
      disabled_actions.push("list");
      disabled_actions.push("view");
    }

    return disabled_actions;
  }

  return {
    subscribe,
    initialize,
    switch_profile,
    refresh_profiles,
    get_current_role,
    logout,
    reset_initialized_state: (): void => {
      update((s) => ({ ...s, is_initialized: false }));
    },
    get_sidebar_menu_items,
    get_authorization_level,
    is_authorized_to_execute,
    get_feature_access,
    is_functionality_disabled,
    get_disabled_functionalities,
  };
}

export const auth_store = create_auth_store();

const current_auth_token = derived(
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

export const current_profile_organization_name = derived(auth_store, ($auth) => {
  return $auth.current_profile?.organization_name ?? "";
});

export const current_profile_display_name = derived(auth_store, ($auth) => {
  return $auth.current_profile?.display_name ?? "Guest";
});

export const current_profile_initials = derived(auth_store, ($auth) => {
  const name = $auth.current_profile?.display_name ?? "";
  if (!name) return "?";
  const words = name.split(" ").filter((w) => w.length > 0);
  if (words.length >= 2) {
    return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
});

const available_profiles = derived(
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

export const is_public_viewer = derived(
  auth_store,
  ($auth) => $auth.current_profile?.role === "public_viewer",
);

export const sidebar_menu_items = derived(auth_store, ($auth) => {
  return $auth.sidebar_menu_items;
});

const feature_access = derived(auth_store, ($auth) => {
  if (!$auth.is_initialized || !$auth.current_profile) {
    return {
      can_reset_demo: false,
      can_view_audit_logs: false,
      can_access_dashboard: false,
      can_switch_profiles: false,
      audit_logs_scope: "none" as const,
    };
  }
  const role = $auth.current_profile.role;
  const is_super_admin = role === "super_admin";
  const is_org_admin = role === "org_admin";
  const is_not_signed_in = role === "public_viewer";

  return {
    can_reset_demo: is_super_admin,
    can_view_audit_logs: is_super_admin || is_org_admin,
    can_access_dashboard: true,
    can_switch_profiles: is_super_admin || is_not_signed_in,
    audit_logs_scope: is_super_admin
      ? ("all" as const)
      : is_org_admin
        ? ("organization" as const)
        : ("none" as const),
  };
});

export const can_switch_profiles = derived(
  auth_store,
  ($auth) =>
    $auth.current_profile?.role === "super_admin" ||
    $auth.current_profile?.role === "public_viewer",
);

function get_entity_authorization_level(
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

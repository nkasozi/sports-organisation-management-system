import { writable, derived, get } from "svelte/store";
import { browser } from "$app/environment";
import type {
  AuthToken,
  AuthTokenPayload,
  UserRole,
} from "$lib/core/interfaces/ports";
import {
  set_user_context,
  clear_user_context,
} from "$lib/infrastructure/events/EventBus";
import {
  USER_ROLE_DISPLAY_NAMES,
  USER_ROLE_ORDER,
  ANY_VALUE,
} from "$lib/core/interfaces/ports";
import { get_authentication_adapter } from "$lib/adapters/iam/LocalAuthenticationAdapter";
import { get_system_user_repository } from "$lib/adapters/repositories/InBrowserSystemUserRepository";
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
import {
  SEED_ORGANIZATION_IDS,
  SEED_TEAM_IDS,
  SEED_PLAYER_IDS,
  SEED_OFFICIAL_IDS,
} from "$lib/infrastructure/utils/SeedDataGenerator";
import { sync_branding_with_profile } from "$lib/adapters/initialization/brandingSyncService";

const ENTITY_DATA_CATEGORY_MAP: Record<string, DataCategory> = {
  organization: "root_level",
  sport: "root_level",
  gender: "root_level",
  competitionformat: "root_level",
  identificationtype: "root_level",
  gameofficialrole: "root_level",
  gameeventtype: "root_level",
  teamstaffrole: "root_level",
  playerposition: "root_level",
  help: "root_level",
  settings: "org_administrator_level",
  systemsettings: "org_administrator_level",
  auditlog: "org_administrator_level",
  systemuser: "org_administrator_level",
  competition: "organisation_level",
  team: "organisation_level",
  official: "organisation_level",
  venue: "organisation_level",
  fixture: "organisation_level",
  fixturedetailssetup: "organisation_level",
  livegamelog: "organisation_level",
  gameeventlog: "organisation_level",
  playerteammembership: "organisation_level",
  playerteamtransferhistory: "organisation_level",
  teamstaff: "team_level",
  fixturelineup: "team_level",
  competitionteam: "team_level",
  player: "player_level",
  playerprofile: "public_level",
  identification: "public_level",
  qualification: "public_level",
  jerseycolor: "public_level",
  profilelink: "public_level",
  activitycategory: "public_level",
  teamprofile: "public_level",
};

function get_entity_data_category(entity_type: string): DataCategory {
  const normalized_type = entity_type.toLowerCase().replace(/[\s_-]/g, "");
  return ENTITY_DATA_CATEGORY_MAP[normalized_type] || "organisation_level";
}

function check_entity_permission(
  role: UserRole,
  entity_type: string,
  action: DataAction,
  permissions: Record<DataCategory, CategoryPermissions>,
): boolean {
  const category = get_entity_data_category(entity_type);
  const category_permissions = permissions[category];
  return category_permissions[action];
}

const NO_PERMISSIONS: CategoryPermissions = {
  create: false,
  read: false,
  update: false,
  delete: false,
};

const FULL_PERMISSIONS: CategoryPermissions = {
  create: true,
  read: true,
  update: true,
  delete: true,
};

const READ_ONLY_PERMISSIONS: CategoryPermissions = {
  create: false,
  read: true,
  update: false,
  delete: false,
};

const ROLE_PERMISSION_MAP: Record<
  UserRole,
  Record<DataCategory, CategoryPermissions>
> = {
  super_admin: {
    root_level: FULL_PERMISSIONS,
    org_administrator_level: FULL_PERMISSIONS,
    organisation_level: FULL_PERMISSIONS,
    team_level: FULL_PERMISSIONS,
    player_level: FULL_PERMISSIONS,
    public_level: FULL_PERMISSIONS,
  },
  org_admin: {
    root_level: READ_ONLY_PERMISSIONS,
    org_administrator_level: FULL_PERMISSIONS,
    organisation_level: FULL_PERMISSIONS,
    team_level: FULL_PERMISSIONS,
    player_level: FULL_PERMISSIONS,
    public_level: FULL_PERMISSIONS,
  },
  officials_manager: {
    root_level: READ_ONLY_PERMISSIONS,
    org_administrator_level: NO_PERMISSIONS,
    organisation_level: {
      create: false,
      read: true,
      update: true,
      delete: false,
    },
    team_level: READ_ONLY_PERMISSIONS,
    player_level: READ_ONLY_PERMISSIONS,
    public_level: FULL_PERMISSIONS,
  },
  team_manager: {
    root_level: READ_ONLY_PERMISSIONS,
    org_administrator_level: NO_PERMISSIONS,
    organisation_level: READ_ONLY_PERMISSIONS,
    team_level: FULL_PERMISSIONS,
    player_level: FULL_PERMISSIONS,
    public_level: FULL_PERMISSIONS,
  },
  official: {
    root_level: READ_ONLY_PERMISSIONS,
    org_administrator_level: NO_PERMISSIONS,
    organisation_level: READ_ONLY_PERMISSIONS,
    team_level: READ_ONLY_PERMISSIONS,
    player_level: READ_ONLY_PERMISSIONS,
    public_level: FULL_PERMISSIONS,
  },
  player: {
    root_level: READ_ONLY_PERMISSIONS,
    org_administrator_level: NO_PERMISSIONS,
    organisation_level: READ_ONLY_PERMISSIONS,
    team_level: READ_ONLY_PERMISSIONS,
    player_level: { create: false, read: true, update: true, delete: false },
    public_level: FULL_PERMISSIONS,
  },
};

function get_role_permissions_sync(
  role: UserRole,
): Record<DataCategory, CategoryPermissions> {
  return ROLE_PERMISSION_MAP[role] || ROLE_PERMISSION_MAP.player;
}

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
  sidebar_menu_items: SidebarMenuGroup[];
  is_initialized: boolean;
}

const AUTH_STORAGE_KEY = "sports-org-auth-token";
const PROFILE_STORAGE_KEY = "sports-org-current-profile-id";

function create_default_profiles(): UserProfile[] {
  return [
    {
      id: "super-admin-profile",
      display_name: "Super Admin",
      email: "nkasozi@gmail.com",
      role: "super_admin",
      organization_id: ANY_VALUE,
      team_id: ANY_VALUE,
      player_id: ANY_VALUE,
    },
    {
      id: "org-admin-profile",
      display_name: "Organisation Admin (Uganda Hockey)",
      email: "orgadmin@ugandahockey.local",
      role: "org_admin",
      organization_id: SEED_ORGANIZATION_IDS.UGANDA_HOCKEY_ASSOCIATION,
      team_id: ANY_VALUE,
      player_id: ANY_VALUE,
    },
    {
      id: "officials-manager-profile",
      display_name: "Officials Manager (Uganda Hockey)",
      email: "officials@ugandahockey.local",
      role: "officials_manager",
      organization_id: SEED_ORGANIZATION_IDS.UGANDA_HOCKEY_ASSOCIATION,
      team_id: ANY_VALUE,
      player_id: ANY_VALUE,
    },
    {
      id: "team-manager-profile",
      display_name: "Team Manager (Weatherhead HC)",
      email: "manager@weatherheadhc.local",
      role: "team_manager",
      organization_id: SEED_ORGANIZATION_IDS.UGANDA_HOCKEY_ASSOCIATION,
      team_id: SEED_TEAM_IDS.WEATHERHEAD_HC,
      player_id: ANY_VALUE,
    },
    {
      id: "official-profile",
      display_name: "Michael Anderson (Official)",
      email: "michael.anderson@ugandahockey.local",
      role: "official",
      organization_id: SEED_ORGANIZATION_IDS.UGANDA_HOCKEY_ASSOCIATION,
      team_id: ANY_VALUE,
      player_id: ANY_VALUE,
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
    sidebar_menu_items: [],
    is_initialized: false,
  };

  const { subscribe, set, update } = writable<AuthState>(initial_state);

  async function generate_token_for_profile(
    profile: UserProfile,
  ): Promise<AuthToken> {
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
      throw new Error(token_result.error);
    }

    return token_result.data;
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

  async function initialize(): Promise<void> {
    const available_profiles = create_default_profiles();
    const saved_profile_id = load_saved_profile_id();
    const saved_token_raw = load_saved_token();

    let current_profile: UserProfile | null = null;
    let current_token: AuthToken | null = null;

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
        current_profile =
          available_profiles.find(
            (p) => p.id === verification.payload?.user_id,
          ) || null;

        if (current_profile && verification.payload) {
          current_token = {
            payload: verification.payload,
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
      available_profiles: create_default_profiles(),
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
    const permissions = get_role_permissions_sync(role);
    const authorizations = new Map<AuthorizableAction, AuthorizationLevel>();

    const category = get_entity_data_category(entity_type);
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
    const permissions = get_role_permissions_sync(role);
    const data_action = map_authorizable_action_to_data_action(action);

    if (!data_action) {
      return {
        is_authorized: true,
        authorization_level: "full",
      };
    }

    const is_authorized = check_entity_permission(
      role,
      entity_type,
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
        audit_logs_scope: "none",
      };
    }

    const role = state.current_profile.role;
    const is_super_admin = role === "super_admin";
    const is_org_admin = role === "org_admin";

    return {
      can_reset_demo: is_super_admin,
      can_view_audit_logs: is_super_admin || is_org_admin,
      can_access_dashboard: true,
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

    const permissions = get_role_permissions_sync(state.current_profile.role);
    return !check_entity_permission(
      state.current_profile.role,
      entity_type,
      data_action,
      permissions,
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

    const permissions = get_role_permissions_sync(state.current_profile.role);
    const disabled_actions: AuthorizableAction[] = [];

    if (
      !check_entity_permission(
        state.current_profile.role,
        entity_type,
        "create",
        permissions,
      )
    ) {
      disabled_actions.push("create");
    }
    if (
      !check_entity_permission(
        state.current_profile.role,
        entity_type,
        "update",
        permissions,
      )
    ) {
      disabled_actions.push("edit");
    }
    if (
      !check_entity_permission(
        state.current_profile.role,
        entity_type,
        "delete",
        permissions,
      )
    ) {
      disabled_actions.push("delete");
    }
    if (
      !check_entity_permission(
        state.current_profile.role,
        entity_type,
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

export const sidebar_menu_items = derived(auth_store, ($auth) => {
  return $auth.sidebar_menu_items;
});

export const feature_access = derived(auth_store, ($auth) => {
  if (!$auth.is_initialized || !$auth.current_profile) {
    return {
      can_reset_demo: false,
      can_view_audit_logs: false,
      can_access_dashboard: false,
      audit_logs_scope: "none" as const,
    };
  }
  const role = $auth.current_profile.role;
  const is_super_admin = role === "super_admin";
  const is_org_admin = role === "org_admin";

  return {
    can_reset_demo: is_super_admin,
    can_view_audit_logs: is_super_admin || is_org_admin,
    can_access_dashboard: true,
    audit_logs_scope: is_super_admin
      ? ("all" as const)
      : is_org_admin
        ? ("organization" as const)
        : ("none" as const),
  };
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

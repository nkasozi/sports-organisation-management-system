import { get } from "svelte/store";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type {
  AuthorizableAction,
  AuthorizationCheckResult,
  EntityAuthorizationMap,
  SidebarMenuGroup,
} from "$lib/core/interfaces/ports";

import {
  can_switch_profiles,
  check_action_authorization,
  current_profile_display_name,
  current_profile_email,
  current_profile_initials,
  current_profile_organization_name,
  current_profile_team_id,
  current_user_role,
  current_user_role_display,
  get_disabled_crud_actions,
  get_entity_authorization_level,
  is_auth_initialized,
  is_public_viewer,
  other_available_profiles,
  sidebar_menu_items,
} from "./authDerivedStores";
import {
  type AuthState,
  create_missing_auth_profile_state,
  create_missing_auth_token_state,
  create_present_auth_profile_state,
  type UserProfile,
} from "./authTypes";

function create_profile(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    id: "profile-1",
    display_name: "Default User",
    email: "default@example.test",
    role: "org_admin",
    organization_id: "organization-1",
    organization_name: "City Hawks",
    team_id: "",
    ...overrides,
  } as UserProfile;
}

const authorization_ports_mock = vi.hoisted(() => ({
  check_data_permission: vi.fn(),
}));

const auth_store_mock = vi.hoisted(() => {
  let current_value = {
    current_token: { status: "missing" },
    current_profile: { status: "missing" },
    available_profiles: [],
    sidebar_menu_items: [],
    is_initialized: false,
    is_demo_session: false,
  } as AuthState;
  const subscribers = new Set<(value: AuthState) => void>();
  const get_authorization_level = vi.fn();
  const is_authorized_to_execute = vi.fn();
  const get_disabled_functionalities = vi.fn();

  return {
    set_state: (next_value: AuthState): void => {
      current_value = next_value;
      subscribers.forEach((subscriber) => subscriber(current_value));
    },
    get_authorization_level,
    is_authorized_to_execute,
    get_disabled_functionalities,
    auth_store: {
      subscribe(subscriber: (value: AuthState) => void): () => void {
        subscriber(current_value);
        subscribers.add(subscriber);
        return () => subscribers.delete(subscriber);
      },
      get_authorization_level: (entity_type: string) =>
        get_authorization_level(entity_type),
      is_authorized_to_execute: (
        action: string,
        entity_type: string,
        entity_id?: string,
        target_organization_id?: string,
        target_team_id?: string,
      ) =>
        is_authorized_to_execute(
          action,
          entity_type,
          entity_id,
          target_organization_id,
          target_team_id,
        ),
      get_disabled_functionalities: (entity_type: string) =>
        get_disabled_functionalities(entity_type),
    },
  };
});

vi.mock("$lib/core/interfaces/ports", () => ({
  USER_ROLE_DISPLAY_NAMES: {
    org_admin: "Organization Admin",
    public_viewer: "Public Viewer",
  },
  check_data_permission: authorization_ports_mock.check_data_permission,
}));

vi.mock("./authStoreCore", () => ({
  auth_store: auth_store_mock.auth_store,
}));

describe("authDerivedStores", () => {
  beforeEach(() => {
    authorization_ports_mock.check_data_permission.mockReset();
    authorization_ports_mock.check_data_permission.mockReturnValue(true);
    auth_store_mock.get_authorization_level.mockReset();
    auth_store_mock.is_authorized_to_execute.mockReset();
    auth_store_mock.get_disabled_functionalities.mockReset();
    auth_store_mock.set_state({
      current_token: create_missing_auth_token_state(),
      current_profile: create_missing_auth_profile_state(),
      available_profiles: [],
      sidebar_menu_items: [],
      is_initialized: false,
      is_demo_session: false,
    });
  });

  it("derives the current profile fields and alternate profiles", () => {
    const current_profile = create_profile({
      id: "profile-1",
      display_name: "Jane Doe",
      email: "jane@example.test",
      team_id: "team-1",
    });
    const alternate_profile = create_profile({
      id: "profile-2",
      display_name: "Chris Roe",
      email: "chris@example.test",
      role: "public_viewer",
      team_id: "",
    });
    const sidebar_groups = [
      { group_name: "Operations", items: [] },
    ] as SidebarMenuGroup[];

    auth_store_mock.set_state({
      current_token: create_missing_auth_token_state(),
      current_profile: create_present_auth_profile_state(current_profile),
      available_profiles: [current_profile, alternate_profile],
      sidebar_menu_items: sidebar_groups,
      is_initialized: true,
      is_demo_session: true,
    });

    expect(get(current_user_role)).toBe("org_admin");
    expect(get(current_user_role_display)).toBe("Organization Admin");
    expect(get(current_profile_organization_name)).toBe("City Hawks");
    expect(get(current_profile_display_name)).toBe("Jane Doe");
    expect(get(current_profile_email)).toBe("jane@example.test");
    expect(get(current_profile_team_id)).toBe("team-1");
    expect(get(current_profile_initials)).toBe("JD");
    expect(get(other_available_profiles)).toEqual([alternate_profile]);
    expect(get(is_auth_initialized)).toBe(true);
    expect(get(sidebar_menu_items)).toEqual(sidebar_groups);
    expect(get(can_switch_profiles)).toBe(true);
  });

  it("falls back to guest values and detects public viewers from permission checks", () => {
    auth_store_mock.set_state({
      current_token: create_missing_auth_token_state(),
      current_profile: create_present_auth_profile_state(
        create_profile({
          id: "profile-3",
          display_name: "Solo",
          email: "solo@example.test",
          role: "public_viewer",
          organization_name: "Public League",
          team_id: "",
        }),
      ),
      available_profiles: [],
      sidebar_menu_items: [],
      is_initialized: false,
      is_demo_session: false,
    });
    authorization_ports_mock.check_data_permission.mockReturnValue(false);
    auth_store_mock.set_state({
      current_token: create_missing_auth_token_state(),
      current_profile: create_present_auth_profile_state(
        create_profile({
          id: "profile-3",
          display_name: "Solo",
          email: "solo@example.test",
          role: "public_viewer",
          organization_name: "Public League",
          team_id: "",
        }),
      ),
      available_profiles: [],
      sidebar_menu_items: [],
      is_initialized: false,
      is_demo_session: false,
    });

    expect(get(current_profile_initials)).toBe("SO");
    expect(get(is_public_viewer)).toBe(true);

    auth_store_mock.set_state({
      current_token: create_missing_auth_token_state(),
      current_profile: create_missing_auth_profile_state(),
      available_profiles: [],
      sidebar_menu_items: [],
      is_initialized: false,
      is_demo_session: false,
    });

    expect(get(current_user_role)).toBe("");
    expect(get(current_user_role_display)).toBe("Unknown");
    expect(get(current_profile_display_name)).toBe("Guest");
    expect(get(current_profile_email)).toBe("");
    expect(get(current_profile_initials)).toBe("?");
    expect(get(is_public_viewer)).toBe(false);
  });

  it("delegates authorization helper calls to the auth store", () => {
    const authorization_level = {
      entity_type: "players",
      authorizations: new Map([["view", "organization"]]),
    } as EntityAuthorizationMap;
    const authorization_result = {
      is_authorized: true,
      authorization_level: "full",
    } as AuthorizationCheckResult;
    const disabled_actions = ["delete"] as AuthorizableAction[];

    auth_store_mock.get_authorization_level.mockReturnValue(
      authorization_level,
    );
    auth_store_mock.is_authorized_to_execute.mockReturnValue(
      authorization_result,
    );
    auth_store_mock.get_disabled_functionalities.mockReturnValue(
      disabled_actions,
    );

    expect(get_entity_authorization_level("players")).toBe(authorization_level);
    expect(
      check_action_authorization(
        "view",
        "players",
        "player-1",
        "organization-1",
        "team-1",
      ),
    ).toBe(authorization_result);
    expect(get_disabled_crud_actions("players")).toEqual(disabled_actions);
    expect(auth_store_mock.get_authorization_level).toHaveBeenCalledWith(
      "players",
    );
    expect(auth_store_mock.is_authorized_to_execute).toHaveBeenCalledWith(
      "view",
      "players",
      "player-1",
      "organization-1",
      "team-1",
    );
    expect(auth_store_mock.get_disabled_functionalities).toHaveBeenCalledWith(
      "players",
    );
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";

import type { AuthState, UserProfile } from "./authTypes";

function create_profile(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    id: "profile-1",
    display_name: "Admin User",
    email: "admin@example.com",
    role: "org_admin",
    organization_id: "organization-1",
    organization_name: "Premier League",
    team_id: "",
    ...overrides,
  } as UserProfile;
}

function create_auth_state(
  current_profile: UserProfile | null,
  overrides: Partial<AuthState> = {},
): AuthState {
  return {
    current_token: null,
    current_profile,
    available_profiles: current_profile ? [current_profile] : [],
    sidebar_menu_items: [],
    is_initialized: false,
    is_demo_session: false,
    ...overrides,
  } as AuthState;
}

const {
  check_data_permission_mock,
  check_entity_permission_mock,
  get_entity_data_category_mock,
  get_role_permissions_sync_mock,
  map_authorizable_action_to_data_action_mock,
  normalize_to_entity_type_mock,
} = vi.hoisted(() => ({
  check_data_permission_mock: vi.fn(),
  check_entity_permission_mock: vi.fn(),
  get_entity_data_category_mock: vi.fn(),
  get_role_permissions_sync_mock: vi.fn(),
  map_authorizable_action_to_data_action_mock: vi.fn(),
  normalize_to_entity_type_mock: vi.fn(),
}));

vi.mock("$lib/core/interfaces/ports", () => ({
  ANY_VALUE: "*",
  check_data_permission: check_data_permission_mock,
}));

vi.mock("$lib/core/interfaces/ports/external/iam/AuthorizationPort", () => ({
  normalize_to_entity_type: normalize_to_entity_type_mock,
}));

vi.mock("$lib/presentation/stores/authPermissionCore", () => ({
  check_entity_permission: check_entity_permission_mock,
  get_entity_data_category: get_entity_data_category_mock,
  get_role_permissions_sync: get_role_permissions_sync_mock,
  map_authorizable_action_to_data_action:
    map_authorizable_action_to_data_action_mock,
}));

import {
  compute_authorization_level,
  compute_disabled_functionalities,
  compute_feature_access,
  compute_is_authorized_to_execute,
  compute_is_functionality_disabled,
} from "./authPermissions";

describe("authPermissions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    normalize_to_entity_type_mock.mockImplementation((value: string) => value);
    get_entity_data_category_mock.mockReturnValue("organisation_level");
    get_role_permissions_sync_mock.mockReturnValue({
      success: true,
      data: {
        organisation_level: {
          read: true,
          create: true,
          update: false,
          delete: false,
        },
      },
    });
    map_authorizable_action_to_data_action_mock.mockImplementation(
      (action: string) =>
        ({
          create: "create",
          edit: "update",
          delete: "delete",
          list: "read",
          view: "read",
        })[action],
    );
  });

  it("returns empty authorization metadata when no profile is available", () => {
    expect(
      compute_authorization_level(create_auth_state(null), "team"),
    ).toEqual({
      entity_type: "team",
      authorizations: new Map(),
    });
    expect(
      compute_is_authorized_to_execute(create_auth_state(null), "view", "team"),
    ).toEqual({
      is_authorized: false,
      authorization_level: "none",
      error_message: "No authentication profile available",
    });
  });

  it("maps role permissions into authorization levels", () => {
    const result = compute_authorization_level(
      create_auth_state(create_profile()),
      "team",
    );

    expect(result.entity_type).toBe("team");
    expect(result.authorizations.get("view")).toBe("full");
    expect(result.authorizations.get("create")).toBe("full");
    expect(result.authorizations.get("edit")).toBe("none");
    expect(result.authorizations.get("delete")).toBe("none");
  });

  it("delegates execution checks and allows unmapped actions", () => {
    check_entity_permission_mock.mockReturnValueOnce(false);

    expect(
      compute_is_authorized_to_execute(
        create_auth_state(create_profile()),
        "edit",
        "team",
      ),
    ).toEqual({
      is_authorized: false,
      authorization_level: "none",
      error_message:
        'Role "org_admin" does not have "edit" permission for "team"',
    });

    map_authorizable_action_to_data_action_mock.mockReturnValueOnce(undefined);
    expect(
      compute_is_authorized_to_execute(
        create_auth_state(create_profile()),
        "view",
        "team",
      ),
    ).toEqual({
      is_authorized: true,
      authorization_level: "full",
    });
  });

  it("derives feature access from role scope and demo-session state", () => {
    check_data_permission_mock.mockImplementation(
      (role: string, level: string, action: string) =>
        role === "org_admin" &&
        level === "org_administrator_level" &&
        action === "read",
    );

    expect(
      compute_feature_access(
        create_auth_state(create_profile({ organization_id: "*" }), {
          is_demo_session: true,
        }),
      ),
    ).toEqual({
      can_reset_demo: false,
      can_view_audit_logs: true,
      can_access_dashboard: true,
      can_switch_profiles: true,
      audit_logs_scope: "all",
    });
  });

  it("computes disabled functionalities from per-action permission checks", () => {
    check_entity_permission_mock.mockImplementation(
      (_role: string, _entity_type: string, action: string) =>
        action === "update",
    );

    expect(
      compute_is_functionality_disabled(
        create_auth_state(create_profile()),
        "edit",
        "team",
      ),
    ).toBe(false);
    expect(
      compute_is_functionality_disabled(
        create_auth_state(create_profile()),
        "delete",
        "team",
      ),
    ).toBe(true);
    expect(
      compute_disabled_functionalities(
        create_auth_state(create_profile()),
        "team",
      ),
    ).toEqual(["create", "delete", "list", "view"]);
  });
});

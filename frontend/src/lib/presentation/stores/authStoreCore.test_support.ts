import { type Mock, vi } from "vitest";

import type { AuthToken } from "$lib/core/interfaces/ports";

import {
  type AuthState,
  create_missing_auth_profile_state,
  create_missing_auth_token_state,
  type UserProfile,
} from "./authTypes";

const AUTH_STORE_CORE_MOCK_NAMES = [
  "sync_branding_with_profile",
  "get_organization_repository",
  "get_system_user_repository",
  "get_team_repository",
  "build_profiles_with_public_viewer",
  "clear_auth_storage",
  "generate_token_for_profile",
  "load_sidebar_menu_for_role",
  "save_profile_id",
  "save_token",
  "sync_user_context_with_event_bus",
  "execute_auth_initialization",
  "compute_authorization_level",
  "compute_disabled_functionalities",
  "compute_feature_access",
  "compute_is_authorized_to_execute",
  "compute_is_functionality_disabled",
  "load_profiles_from_repository",
] as const;

type AuthStoreCoreMocks = Record<
  (typeof AUTH_STORE_CORE_MOCK_NAMES)[number],
  Mock
>;

export function create_auth_store_core_mocks(): AuthStoreCoreMocks {
  return Object.fromEntries(
    AUTH_STORE_CORE_MOCK_NAMES.map((mock_name) => [mock_name, vi.fn()]),
  ) as AuthStoreCoreMocks;
}

export async function import_auth_store(): Promise<
  typeof import("./authStoreCore")
> {
  return import("./authStoreCore");
}

export function prepare_auth_store_core_test(
  mocks: AuthStoreCoreMocks,
): boolean {
  vi.resetModules();
  vi.spyOn(console, "debug").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "log").mockImplementation(() => {});
  Object.values(mocks).forEach((mock: Mock) => mock.mockReset());

  mocks.get_system_user_repository.mockReturnValue({
    kind: "system-user-repository",
  });
  mocks.get_organization_repository.mockReturnValue({
    kind: "organization-repository",
  });
  mocks.get_team_repository.mockReturnValue({
    kind: "team-repository",
  });
  mocks.build_profiles_with_public_viewer.mockImplementation(
    (profiles: unknown[]) => profiles,
  );
  mocks.load_sidebar_menu_for_role.mockResolvedValue([]);
  mocks.execute_auth_initialization.mockResolvedValue({
    success: true,
    data: true,
  });
  return true;
}

export function create_auth_helpers_module_mock(
  mocks: AuthStoreCoreMocks,
): Record<string, Mock> {
  return {
    build_profiles_with_public_viewer: mocks.build_profiles_with_public_viewer,
    clear_auth_storage: mocks.clear_auth_storage,
    generate_token_for_profile: mocks.generate_token_for_profile,
    load_sidebar_menu_for_role: mocks.load_sidebar_menu_for_role,
    save_profile_id: mocks.save_profile_id,
    save_token: mocks.save_token,
    sync_user_context_with_event_bus: mocks.sync_user_context_with_event_bus,
  };
}

export function create_auth_permissions_module_mock(
  mocks: AuthStoreCoreMocks,
): Record<string, Mock> {
  return {
    compute_authorization_level: mocks.compute_authorization_level,
    compute_disabled_functionalities: mocks.compute_disabled_functionalities,
    compute_feature_access: mocks.compute_feature_access,
    compute_is_authorized_to_execute: mocks.compute_is_authorized_to_execute,
    compute_is_functionality_disabled: mocks.compute_is_functionality_disabled,
  };
}

export function build_profile(
  overrides: Partial<UserProfile> = {},
): UserProfile {
  return {
    id: "profile-1",
    display_name: "Jane Doe",
    email: "jane@example.test",
    role: "org_admin",
    organization_id: "organization-1",
    organization_name: "City Hawks",
    team_id: "team-1",
    ...overrides,
  } as UserProfile;
}

export function build_auth_state(
  overrides: Partial<AuthState> = {},
): AuthState {
  return {
    current_token: create_missing_auth_token_state(),
    current_profile: create_missing_auth_profile_state(),
    available_profiles: [],
    sidebar_menu_items: [],
    is_initialized: false,
    is_demo_session: false,
    ...overrides,
  } as AuthState;
}

export function build_auth_token(
  raw_token: string,
  user_id: string = "profile-1",
): AuthToken {
  return {
    payload: {
      user_id,
      email: "jane@example.test",
      display_name: "Jane Doe",
      role: "org_admin",
      organization_id: "organization-1",
      team_id: "team-1",
      issued_at: 1,
      expires_at: 2,
    },
    signature: "signature",
    raw_token,
  } as AuthToken;
}

import { get } from "svelte/store";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  build_auth_state,
  build_profile,
  import_auth_store,
  prepare_auth_store_core_test,
} from "./authStoreCore.test_support";
import {
  type AuthState,
  create_missing_auth_profile_state,
  create_missing_auth_token_state,
  create_present_auth_profile_state,
} from "./authTypes";

const auth_store_core_mocks = await vi.hoisted(async () =>
  (await import("./authStoreCore.test_support")).create_auth_store_core_mocks(),
);

vi.mock("$lib/adapters/initialization/brandingSyncService", () => ({
  sync_branding_with_profile: auth_store_core_mocks.sync_branding_with_profile,
}));

vi.mock("$lib/adapters/repositories/InBrowserOrganizationRepository", () => ({
  get_organization_repository:
    auth_store_core_mocks.get_organization_repository,
}));

vi.mock("$lib/adapters/repositories/InBrowserSystemUserRepository", () => ({
  get_system_user_repository: auth_store_core_mocks.get_system_user_repository,
}));

vi.mock("$lib/adapters/repositories/InBrowserTeamRepository", () => ({
  get_team_repository: auth_store_core_mocks.get_team_repository,
}));

vi.mock("./authHelpers", async () =>
  (
    await import("./authStoreCore.test_support")
  ).create_auth_helpers_module_mock(auth_store_core_mocks),
);

vi.mock("./authInitialize", () => ({
  execute_auth_initialization:
    auth_store_core_mocks.execute_auth_initialization,
}));

vi.mock("./authPermissions", async () =>
  (
    await import("./authStoreCore.test_support")
  ).create_auth_permissions_module_mock(auth_store_core_mocks),
);

vi.mock("./profileLoader", () => ({
  load_profiles_from_repository:
    auth_store_core_mocks.load_profiles_from_repository,
}));

describe("authStoreCore", () => {
  beforeEach(() => {
    prepare_auth_store_core_test(auth_store_core_mocks);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("clears auth state and delegates permission helpers from the current store state", async () => {
    const current_profile = build_profile({ role: "org_admin" });
    const sidebar_groups = [{ group_name: "Operations", items: [] }];

    auth_store_core_mocks.execute_auth_initialization.mockImplementation(
      async (_state: unknown, set_state: (state: AuthState) => void) => {
        set_state(
          build_auth_state({
            current_profile: create_present_auth_profile_state(current_profile),
            available_profiles: [current_profile],
            sidebar_menu_items: sidebar_groups,
            is_initialized: true,
            is_demo_session: true,
          }),
        );
        return { success: true, data: true };
      },
    );
    auth_store_core_mocks.compute_authorization_level.mockReturnValue({
      read: "organization",
    });
    auth_store_core_mocks.compute_is_authorized_to_execute.mockReturnValue({
      success: true,
    });
    auth_store_core_mocks.compute_feature_access.mockReturnValue({
      can_view_dashboard: true,
    });
    auth_store_core_mocks.compute_is_functionality_disabled.mockReturnValue(
      false,
    );
    auth_store_core_mocks.compute_disabled_functionalities.mockReturnValue([
      "delete",
    ]);

    const { auth_store } = await import_auth_store();

    expect((await auth_store.initialize()).success).toBe(true);
    expect(auth_store.get_current_role()).toBe("org_admin");
    expect(auth_store.get_sidebar_menu_items()).toEqual(sidebar_groups);
    expect(auth_store.get_authorization_level("players")).toEqual({
      read: "organization",
    });
    expect(auth_store.is_authorized_to_execute("read", "players")).toEqual({
      success: true,
    });
    expect(auth_store.get_feature_access()).toEqual({
      can_view_dashboard: true,
    });
    expect(auth_store.is_functionality_disabled("delete", "players")).toBe(
      false,
    );
    expect(auth_store.get_disabled_functionalities("players")).toEqual([
      "delete",
    ]);
    expect(auth_store.mark_as_demo_session()).toBe(true);
    auth_store.reset_initialized_state();
    expect(get(auth_store)).toEqual(
      expect.objectContaining({
        is_initialized: false,
        is_demo_session: false,
      }),
    );

    await auth_store.logout();

    expect(auth_store_core_mocks.clear_auth_storage).toHaveBeenCalled();
    expect(
      auth_store_core_mocks.sync_user_context_with_event_bus,
    ).toHaveBeenCalledWith({ status: "cleared" });
    expect(get(auth_store)).toEqual({
      current_token: create_missing_auth_token_state(),
      current_profile: create_missing_auth_profile_state(),
      available_profiles: [],
      sidebar_menu_items: [],
      is_initialized: false,
      is_demo_session: false,
    });
  });
});

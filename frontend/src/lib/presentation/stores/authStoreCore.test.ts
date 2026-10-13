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

  it("delegates initialization to the auth initialization use case", async () => {
    const { auth_store } = await import_auth_store();

    const result = await auth_store.initialize();

    expect(result).toEqual({ success: true, data: true });
    expect(
      auth_store_core_mocks.execute_auth_initialization,
    ).toHaveBeenCalledWith(
      {
        current_token: create_missing_auth_token_state(),
        current_profile: create_missing_auth_profile_state(),
        available_profiles: [],
        sidebar_menu_items: [],
        is_initialized: false,
        is_demo_session: false,
      },
      expect.any(Function),
    );
  });

  it("refreshes available profiles and keeps the current profile in sync", async () => {
    const initial_profile = build_profile({ display_name: "Original Name" });
    const refreshed_profile = build_profile({ display_name: "Updated Name" });

    auth_store_core_mocks.execute_auth_initialization.mockImplementation(
      async (_state: unknown, set_state: (state: AuthState) => void) => {
        set_state(
          build_auth_state({
            current_profile: create_present_auth_profile_state(initial_profile),
            available_profiles: [initial_profile],
            is_initialized: true,
          }),
        );
        return { success: true, data: true };
      },
    );
    auth_store_core_mocks.load_profiles_from_repository.mockResolvedValue([
      refreshed_profile,
    ]);

    const { auth_store } = await import_auth_store();

    expect((await auth_store.initialize()).success).toBe(true);
    expect(await auth_store.refresh_profiles()).toBe(true);

    expect(
      auth_store_core_mocks.load_profiles_from_repository,
    ).toHaveBeenCalledWith(
      { kind: "system-user-repository" },
      { kind: "organization-repository" },
      { kind: "team-repository" },
    );
    expect(get(auth_store)).toEqual(
      expect.objectContaining({
        available_profiles: [refreshed_profile],
        current_profile: create_present_auth_profile_state(refreshed_profile),
      }),
    );
  });

  it("returns false when switching to a missing profile or when token generation fails", async () => {
    const target_profile = build_profile({ id: "profile-2" });

    auth_store_core_mocks.execute_auth_initialization.mockImplementation(
      async (_state: unknown, set_state: (state: AuthState) => void) => {
        set_state(
          build_auth_state({
            available_profiles: [target_profile],
            is_initialized: true,
          }),
        );
        return { success: true, data: true };
      },
    );
    auth_store_core_mocks.generate_token_for_profile.mockResolvedValue({
      success: false,
      error: "token generation failed",
    });

    const { auth_store } = await import_auth_store();

    expect((await auth_store.initialize()).success).toBe(true);

    expect(await auth_store.switch_profile("missing-profile")).toBe(false);
    expect(await auth_store.switch_profile("profile-2")).toBe(false);
  });
});

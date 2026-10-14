import { get } from "svelte/store";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  build_auth_state,
  build_auth_token,
  build_profile,
  import_auth_store,
  prepare_auth_store_core_test,
} from "./authStoreCore.test_support";
import {
  type AuthState,
  create_present_auth_profile_state,
  create_present_auth_token_state,
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

const TARGET_PROFILE_ID = "system_user_default_4";

describe("authStoreCore", () => {
  beforeEach(() => {
    prepare_auth_store_core_test(auth_store_core_mocks);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("switches profiles, updates state, and syncs dependent systems", async () => {
    const target_profile = build_profile({
      id: TARGET_PROFILE_ID,
      role: "team_manager",
    });
    const generated_token = build_auth_token("new-token", TARGET_PROFILE_ID);
    const sidebar_groups = [{ group_name: "Team", items: [] }];

    auth_store_core_mocks.execute_auth_initialization.mockImplementation(
      async (_state: unknown, set_state: (state: AuthState) => void) => {
        set_state(
          build_auth_state({
            available_profiles: [target_profile],
            is_initialized: true,
            is_demo_session: true,
          }),
        );
        return { success: true, data: true };
      },
    );
    auth_store_core_mocks.generate_token_for_profile.mockResolvedValue({
      success: true,
      data: generated_token,
    });
    auth_store_core_mocks.load_sidebar_menu_for_role.mockResolvedValue(
      sidebar_groups,
    );

    const { auth_store } = await import_auth_store();

    expect((await auth_store.initialize()).success).toBe(true);
    expect(await auth_store.switch_profile(TARGET_PROFILE_ID)).toBe(true);

    expect(auth_store_core_mocks.save_token).toHaveBeenCalledWith("new-token");
    expect(auth_store_core_mocks.save_profile_id).toHaveBeenCalledWith(
      TARGET_PROFILE_ID,
    );
    expect(
      auth_store_core_mocks.sync_user_context_with_event_bus,
    ).toHaveBeenCalledWith({
      status: "present",
      profile: target_profile,
    });
    expect(
      auth_store_core_mocks.sync_branding_with_profile,
    ).toHaveBeenCalledWith({
      status: "present",
      profile: target_profile,
    });
    expect(get(auth_store)).toEqual(
      expect.objectContaining({
        current_token: create_present_auth_token_state(generated_token),
        current_profile: create_present_auth_profile_state(target_profile),
        sidebar_menu_items: sidebar_groups,
      }),
    );
  });

  it("switches to public viewer through the persisted profile flow", async () => {
    const target_profile = build_profile({
      id: "public-viewer",
      display_name: "Public Viewer",
      email: "",
      role: "public_viewer",
      organization_id: "",
      organization_name: "",
      team_id: "",
    });
    const generated_token = build_auth_token(
      "public-viewer-token",
      "public-viewer",
    );
    const sidebar_groups = [{ group_name: "Explore", items: [] }];

    auth_store_core_mocks.execute_auth_initialization.mockImplementation(
      async (_state: unknown, set_state: (state: AuthState) => void) => {
        set_state(
          build_auth_state({
            available_profiles: [target_profile],
            is_initialized: true,
            is_demo_session: true,
          }),
        );
        return { success: true, data: true };
      },
    );
    auth_store_core_mocks.generate_token_for_profile.mockResolvedValue({
      success: true,
      data: generated_token,
    });
    auth_store_core_mocks.load_sidebar_menu_for_role.mockResolvedValue(
      sidebar_groups,
    );

    const { auth_store } = await import_auth_store();

    expect((await auth_store.initialize()).success).toBe(true);
    expect(await auth_store.switch_profile("public-viewer")).toBe(true);

    expect(
      auth_store_core_mocks.generate_token_for_profile,
    ).toHaveBeenCalledWith(target_profile);
    expect(auth_store_core_mocks.clear_auth_storage).not.toHaveBeenCalled();
    expect(auth_store_core_mocks.save_token).toHaveBeenCalledWith(
      "public-viewer-token",
    );
    expect(auth_store_core_mocks.save_profile_id).toHaveBeenCalledWith(
      "public-viewer",
    );
    expect(
      auth_store_core_mocks.sync_user_context_with_event_bus,
    ).toHaveBeenCalledWith({
      status: "present",
      profile: target_profile,
    });
    expect(
      auth_store_core_mocks.sync_branding_with_profile,
    ).toHaveBeenCalledWith({
      status: "present",
      profile: target_profile,
    });
    expect(get(auth_store)).toEqual(
      expect.objectContaining({
        current_token: create_present_auth_token_state(generated_token),
        current_profile: create_present_auth_profile_state(target_profile),
        sidebar_menu_items: sidebar_groups,
      }),
    );
  });
});

import { get } from "svelte/store";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const auth_store_core_mocks = vi.hoisted(() => ({
  sync_branding_with_profile: vi.fn(),
  get_organization_repository: vi.fn(),
  get_system_user_repository: vi.fn(),
  get_team_repository: vi.fn(),
  build_profiles_with_public_viewer: vi.fn(),
  clear_auth_storage: vi.fn(),
  generate_token_for_profile: vi.fn(),
  load_sidebar_menu_for_role: vi.fn(),
  save_profile_id: vi.fn(),
  save_token: vi.fn(),
  sync_user_context_with_event_bus: vi.fn(),
  execute_auth_initialization: vi.fn(),
  compute_authorization_level: vi.fn(),
  compute_disabled_functionalities: vi.fn(),
  compute_feature_access: vi.fn(),
  compute_is_authorized_to_execute: vi.fn(),
  compute_is_functionality_disabled: vi.fn(),
  load_profiles_from_repository: vi.fn(),
}));

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

vi.mock("./authHelpers", () => ({
  build_profiles_with_public_viewer:
    auth_store_core_mocks.build_profiles_with_public_viewer,
  clear_auth_storage: auth_store_core_mocks.clear_auth_storage,
  generate_token_for_profile: auth_store_core_mocks.generate_token_for_profile,
  load_sidebar_menu_for_role: auth_store_core_mocks.load_sidebar_menu_for_role,
  save_profile_id: auth_store_core_mocks.save_profile_id,
  save_token: auth_store_core_mocks.save_token,
  sync_user_context_with_event_bus:
    auth_store_core_mocks.sync_user_context_with_event_bus,
}));

vi.mock("./authInitialize", () => ({
  execute_auth_initialization:
    auth_store_core_mocks.execute_auth_initialization,
}));

vi.mock("./authPermissions", () => ({
  compute_authorization_level:
    auth_store_core_mocks.compute_authorization_level,
  compute_disabled_functionalities:
    auth_store_core_mocks.compute_disabled_functionalities,
  compute_feature_access: auth_store_core_mocks.compute_feature_access,
  compute_is_authorized_to_execute:
    auth_store_core_mocks.compute_is_authorized_to_execute,
  compute_is_functionality_disabled:
    auth_store_core_mocks.compute_is_functionality_disabled,
}));

vi.mock("./profileLoader", () => ({
  load_profiles_from_repository:
    auth_store_core_mocks.load_profiles_from_repository,
}));

function build_profile(
  overrides: Partial<Record<string, unknown>> = {},
): Record<string, unknown> {
  return {
    id: "profile-1",
    display_name: "Jane Doe",
    email: "jane@example.test",
    role: "org_admin",
    organization_id: "organization-1",
    organization_name: "City Hawks",
    team_id: "team-1",
    ...overrides,
  };
}

function build_auth_state(
  overrides: Partial<Record<string, unknown>> = {},
): Record<string, unknown> {
  return {
    current_token: null,
    current_profile: null,
    available_profiles: [],
    sidebar_menu_items: [],
    is_initialized: false,
    is_demo_session: false,
    ...overrides,
  };
}

async function import_auth_store() {
  return import("./authStoreCore");
}

describe("authStoreCore", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.spyOn(console, "debug").mockImplementation(() => undefined);
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.spyOn(console, "log").mockImplementation(() => undefined);
    auth_store_core_mocks.sync_branding_with_profile.mockReset();
    auth_store_core_mocks.get_organization_repository.mockReset();
    auth_store_core_mocks.get_system_user_repository.mockReset();
    auth_store_core_mocks.get_team_repository.mockReset();
    auth_store_core_mocks.build_profiles_with_public_viewer.mockReset();
    auth_store_core_mocks.clear_auth_storage.mockReset();
    auth_store_core_mocks.generate_token_for_profile.mockReset();
    auth_store_core_mocks.load_sidebar_menu_for_role.mockReset();
    auth_store_core_mocks.save_profile_id.mockReset();
    auth_store_core_mocks.save_token.mockReset();
    auth_store_core_mocks.sync_user_context_with_event_bus.mockReset();
    auth_store_core_mocks.execute_auth_initialization.mockReset();
    auth_store_core_mocks.compute_authorization_level.mockReset();
    auth_store_core_mocks.compute_disabled_functionalities.mockReset();
    auth_store_core_mocks.compute_feature_access.mockReset();
    auth_store_core_mocks.compute_is_authorized_to_execute.mockReset();
    auth_store_core_mocks.compute_is_functionality_disabled.mockReset();
    auth_store_core_mocks.load_profiles_from_repository.mockReset();

    auth_store_core_mocks.get_system_user_repository.mockReturnValue({
      kind: "system-user-repository",
    });
    auth_store_core_mocks.get_organization_repository.mockReturnValue({
      kind: "organization-repository",
    });
    auth_store_core_mocks.get_team_repository.mockReturnValue({
      kind: "team-repository",
    });
    auth_store_core_mocks.build_profiles_with_public_viewer.mockImplementation(
      (profiles: unknown[]) => profiles,
    );
    auth_store_core_mocks.load_sidebar_menu_for_role.mockResolvedValue([]);
    auth_store_core_mocks.execute_auth_initialization.mockResolvedValue({
      success: true,
      data: true,
    });
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
        current_token: null,
        current_profile: null,
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
      async (
        _state: unknown,
        set_state: (state: Record<string, unknown>) => void,
      ) => {
        set_state(
          build_auth_state({
            current_profile: initial_profile,
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

    await auth_store.initialize();
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
        current_profile: refreshed_profile,
      }),
    );
  });

  it("returns false when switching to a missing profile or when token generation fails", async () => {
    const target_profile = build_profile({ id: "profile-2" });

    auth_store_core_mocks.execute_auth_initialization.mockImplementation(
      async (
        _state: unknown,
        set_state: (state: Record<string, unknown>) => void,
      ) => {
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

    await auth_store.initialize();

    expect(await auth_store.switch_profile("missing-profile")).toBe(false);
    expect(await auth_store.switch_profile("profile-2")).toBe(false);
  });

  it("switches profiles, updates state, and syncs dependent systems", async () => {
    const target_profile = build_profile({
      id: "profile-2",
      role: "team_manager",
    });
    const generated_token = { raw_token: "new-token" };
    const sidebar_groups = [{ title: "Team", items: [] }];

    auth_store_core_mocks.execute_auth_initialization.mockImplementation(
      async (
        _state: unknown,
        set_state: (state: Record<string, unknown>) => void,
      ) => {
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
      success: true,
      data: generated_token,
    });
    auth_store_core_mocks.load_sidebar_menu_for_role.mockResolvedValue(
      sidebar_groups,
    );

    const { auth_store } = await import_auth_store();

    await auth_store.initialize();
    expect(await auth_store.switch_profile("profile-2")).toBe(true);

    expect(auth_store_core_mocks.save_token).toHaveBeenCalledWith("new-token");
    expect(auth_store_core_mocks.save_profile_id).toHaveBeenCalledWith(
      "profile-2",
    );
    expect(
      auth_store_core_mocks.sync_user_context_with_event_bus,
    ).toHaveBeenCalledWith(target_profile);
    expect(
      auth_store_core_mocks.sync_branding_with_profile,
    ).toHaveBeenCalledWith(target_profile);
    expect(get(auth_store)).toEqual(
      expect.objectContaining({
        current_token: generated_token,
        current_profile: target_profile,
        sidebar_menu_items: sidebar_groups,
      }),
    );
  });

  it("clears auth state and delegates permission helpers from the current store state", async () => {
    const current_profile = build_profile({ role: "org_admin" });
    const sidebar_groups = [{ title: "Operations", items: [] }];

    auth_store_core_mocks.execute_auth_initialization.mockImplementation(
      async (
        _state: unknown,
        set_state: (state: Record<string, unknown>) => void,
      ) => {
        set_state(
          build_auth_state({
            current_profile,
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

    await auth_store.initialize();
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
    ).toHaveBeenCalledWith(null);
    expect(get(auth_store)).toEqual({
      current_token: null,
      current_profile: null,
      available_profiles: [],
      sidebar_menu_items: [],
      is_initialized: false,
      is_demo_session: false,
    });
  });
});

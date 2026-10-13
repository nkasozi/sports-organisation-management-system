import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  create_default_anonymous_state,
  try_restore_anonymous_session,
} from "./authInitializationHelpers";
import {
  type ClerkSessionValue,
  create_auth_token,
  create_profile,
  type TestStore,
} from "./authInitializationHelpers.test_support";
import {
  create_missing_auth_profile_state,
  create_missing_auth_token_state,
  create_present_auth_profile_state,
  create_present_auth_token_state,
  type UserProfile,
} from "./authTypes";

const {
  build_profiles_with_public_viewer_mock,
  clear_auth_storage_mock,
  clerk_session_store,
  get_authentication_adapter_mock,
  is_clerk_loaded_store,
  load_profiles_from_repository_mock,
  load_sidebar_menu_for_role_mock,
  sync_branding_with_profile_mock,
  sync_user_context_with_event_bus_mock,
  verify_token_mock,
} = vi.hoisted(() => {
  function create_store<TValue>(initial_value: TValue): TestStore<TValue> {
    let current_value = initial_value;
    const listeners = new Set<(value: TValue) => void>();

    return {
      set: (value: TValue): void => {
        current_value = value;
        listeners.forEach((listener) => listener(current_value));
      },
      subscribe: (run: (value: TValue) => void): (() => void) => {
        run(current_value);
        listeners.add(run);
        return () => listeners.delete(run);
      },
    } as TestStore<TValue>;
  }

  return {
    build_profiles_with_public_viewer_mock: vi.fn(),
    clear_auth_storage_mock: vi.fn(),
    clerk_session_store: create_store<ClerkSessionValue>({
      user_state: { status: "missing" },
    }),
    get_authentication_adapter_mock: vi.fn(),
    get_team_repository_mock: vi.fn(),
    is_clerk_loaded_store: create_store(false),
    load_profiles_from_repository_mock: vi.fn(),
    load_sidebar_menu_for_role_mock: vi.fn(),
    sync_branding_with_profile_mock: vi.fn(),
    sync_user_context_with_event_bus_mock: vi.fn(),
    verify_token_mock: vi.fn(),
  };
});

vi.mock("$lib/adapters/iam/clerkAuthService", () => ({
  clerk_session: clerk_session_store,
  is_clerk_loaded: is_clerk_loaded_store,
}));

vi.mock("$lib/adapters/iam/LocalAuthenticationAdapter", () => ({
  get_authentication_adapter: get_authentication_adapter_mock,
}));

vi.mock("$lib/adapters/initialization/brandingSyncService", () => ({
  sync_branding_with_profile: sync_branding_with_profile_mock,
}));

vi.mock("$lib/adapters/repositories/InBrowserOrganizationRepository", () => ({
  get_organization_repository: vi.fn(() => ({ repository: "organization" })),
}));

vi.mock("$lib/adapters/repositories/InBrowserSystemUserRepository", () => ({
  get_system_user_repository: vi.fn(() => ({ repository: "system_user" })),
}));

vi.mock("$lib/adapters/repositories/InBrowserTeamRepository", () => ({
  get_team_repository: vi.fn(() => ({ repository: "team" })),
}));

vi.mock("./authHelpers", () => ({
  build_profiles_with_public_viewer: build_profiles_with_public_viewer_mock,
  clear_auth_storage: clear_auth_storage_mock,
  load_sidebar_menu_for_role: load_sidebar_menu_for_role_mock,
  sync_user_context_with_event_bus: sync_user_context_with_event_bus_mock,
}));

vi.mock("./profileLoader", () => ({
  load_profiles_from_repository: load_profiles_from_repository_mock,
}));

describe("authInitializationHelpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clerk_session_store.set({ user_state: { status: "missing" } });
    is_clerk_loaded_store.set(false);
    get_authentication_adapter_mock.mockReturnValue({
      verify_token: verify_token_mock,
    });
  });

  it("restores anonymous sessions when the saved token matches an available profile", async () => {
    const restored_token = create_auth_token();

    verify_token_mock.mockResolvedValueOnce({
      success: true,
      data: {
        is_valid: true,
        payload: restored_token.payload,
      },
    });
    load_sidebar_menu_for_role_mock.mockResolvedValueOnce([
      { group_name: "General", items: [] },
    ]);
    const available_profiles = [create_profile()] as UserProfile[];

    await expect(
      try_restore_anonymous_session(available_profiles, "a.b.signature"),
    ).resolves.toEqual({
      status: "restored",
      auth_state: {
        current_token: create_present_auth_token_state(restored_token),
        current_profile: create_present_auth_profile_state(
          available_profiles[0],
        ),
        available_profiles,
        sidebar_menu_items: [{ group_name: "General", items: [] }],
        is_initialized: true,
        is_demo_session: true,
      },
    });
    expect(sync_user_context_with_event_bus_mock).toHaveBeenCalledWith({
      status: "present",
      profile: available_profiles[0],
    });
    expect(sync_branding_with_profile_mock).toHaveBeenCalledWith({
      status: "present",
      profile: available_profiles[0],
    });
  });

  it("creates the default anonymous state from the public viewer profile", async () => {
    const public_viewer_profile = create_profile({
      id: "public-viewer",
      role: "public_viewer",
      display_name: "Public Viewer",
      email: "public@example.com",
    });

    load_sidebar_menu_for_role_mock.mockResolvedValueOnce([
      { group_name: "General", items: [] },
    ]);

    await expect(
      create_default_anonymous_state([public_viewer_profile]),
    ).resolves.toEqual({
      current_token: create_missing_auth_token_state(),
      current_profile: create_present_auth_profile_state(public_viewer_profile),
      available_profiles: [public_viewer_profile],
      sidebar_menu_items: [{ group_name: "General", items: [] }],
      is_initialized: true,
      is_demo_session: true,
    });
  });

  it("stores an explicit missing profile when the public viewer profile is absent", async () => {
    const error_spy = vi.spyOn(console, "error").mockImplementation(() => {});
    load_sidebar_menu_for_role_mock.mockResolvedValueOnce([]);

    const anonymous_state = await create_default_anonymous_state([]);

    expect(anonymous_state.current_profile).toEqual(
      create_missing_auth_profile_state(),
    );
    expect(error_spy).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ event: "auth_public_viewer_profile_missing" }),
    );
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  load_available_profiles,
  try_restore_anonymous_session,
  wait_for_clerk,
} from "./authInitializationHelpers";
import {
  type ClerkSessionValue,
  create_profile,
  type TestStore,
} from "./authInitializationHelpers.test_support";

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

  it("waits for clerk to load before resolving", async () => {
    const wait_promise = wait_for_clerk();
    is_clerk_loaded_store.set(true);

    await expect(wait_promise).resolves.toBe(true);
  });

  it("loads available profiles and adds the public viewer wrapper", async () => {
    const loaded_profile = create_profile();
    const public_viewer_profile = create_profile({
      id: "public-viewer",
      role: "public_viewer",
      display_name: "Public Viewer",
      email: "public@example.com",
    });

    load_profiles_from_repository_mock.mockResolvedValueOnce([loaded_profile]);
    build_profiles_with_public_viewer_mock.mockReturnValueOnce([
      public_viewer_profile,
      loaded_profile,
    ]);

    await expect(load_available_profiles()).resolves.toEqual([
      public_viewer_profile,
      loaded_profile,
    ]);
    expect(load_profiles_from_repository_mock).toHaveBeenCalledWith(
      { repository: "system_user" },
      { repository: "organization" },
      { repository: "team" },
    );
  });

  it("returns a missing restore state and clears storage when anonymous restore fails token validation", async () => {
    verify_token_mock.mockResolvedValueOnce({
      success: false,
      error: "invalid token",
    });

    await expect(
      try_restore_anonymous_session([create_profile()], "a.b.signature"),
    ).resolves.toEqual({ status: "not_restored" });
    expect(clear_auth_storage_mock).toHaveBeenCalled();
  });
});

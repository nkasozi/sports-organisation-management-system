import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  get_clerk_email,
  try_restore_signed_in_session,
} from "./authInitializationHelpers";
import {
  type ClerkSessionValue,
  create_auth_token,
  create_profile,
  type TestStore,
} from "./authInitializationHelpers.test_support";
import { type UserProfile } from "./authTypes";

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

  it("returns a missing restore state when the saved token belongs to a different clerk user", async () => {
    verify_token_mock.mockResolvedValueOnce({
      success: true,
      data: {
        is_valid: true,
        payload: create_auth_token().payload,
      },
    });

    await expect(
      try_restore_signed_in_session([create_profile()], "a.b.signature", {
        status: "present",
        email: "other@example.com",
      }),
    ).resolves.toEqual({ status: "not_restored" });
    expect(clear_auth_storage_mock).toHaveBeenCalled();
  });

  it("restores signed-in sessions when the token and clerk user match", async () => {
    verify_token_mock.mockResolvedValueOnce({
      success: true,
      data: {
        is_valid: true,
        payload: { user_id: "profile_1" },
      },
    });
    const available_profiles = [create_profile()] as UserProfile[];

    await expect(
      try_restore_signed_in_session(available_profiles, "a.b.signature", {
        status: "present",
        email: "admin@example.com",
      }),
    ).resolves.toEqual({
      status: "restored",
      profile: available_profiles[0],
      token: {
        payload: { user_id: "profile_1" },
        signature: "signature",
        raw_token: "a.b.signature",
      },
    });
  });

  it("reads the lowercase clerk email from the clerk session store", () => {
    clerk_session_store.set({
      user_state: {
        status: "present",
        user: { email_address: "Admin@Example.COM" },
      },
    });

    expect(get_clerk_email()).toEqual({
      status: "present",
      email: "admin@example.com",
    });
  });

  it("returns a missing clerk email state when the clerk session has no user email", () => {
    clerk_session_store.set({
      user_state: { status: "present", user: {} },
    });

    expect(get_clerk_email()).toEqual({ status: "missing" });
  });
});

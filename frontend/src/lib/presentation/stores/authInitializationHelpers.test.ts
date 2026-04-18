import { beforeEach, describe, expect, it, vi } from "vitest";

import type { AuthToken } from "$lib/core/interfaces/ports";

import {
  create_default_anonymous_state,
  get_clerk_email,
  load_available_profiles,
  try_restore_anonymous_session,
  try_restore_signed_in_session,
  wait_for_clerk,
} from "./authInitializationHelpers";
import {
  create_missing_auth_token_state,
  create_present_auth_profile_state,
  create_present_auth_token_state,
  type UserProfile,
} from "./authTypes";

type TestStore<TValue> = {
  set: (value: TValue) => void;
  subscribe: (run: (value: TValue) => void) => () => void;
};

type ClerkSessionValue = {
  user_state:
    | { status: "present"; user: { email_address?: string } }
    | { status: "missing" };
};

function create_profile(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    id: "profile_1",
    display_name: "Admin User",
    email: "admin@example.com",
    role: "org_admin",
    organization_id: "organization-1",
    organization_name: "Premier League",
    team_id: "",
    ...overrides,
  } as UserProfile;
}

function create_auth_token(
  user_id: string = "profile_1",
  raw_token: string = "a.b.signature",
): AuthToken {
  return {
    payload: {
      user_id,
      email: "admin@example.com",
      display_name: "Admin User",
      role: "org_admin",
      organization_id: "organization-1",
      team_id: "",
      issued_at: 1,
      expires_at: 2,
    },
    signature: "signature",
    raw_token,
  } as AuthToken;
}

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

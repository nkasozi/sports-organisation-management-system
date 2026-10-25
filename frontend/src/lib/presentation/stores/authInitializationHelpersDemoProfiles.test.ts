import { beforeEach, describe, expect, it, vi } from "vitest";

import { SEED_SYSTEM_USER_IDS } from "$lib/infrastructure/utils/seed/seedIds";

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
import type { UserProfile } from "./authTypes";

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

describe("authInitializationHelpers demo profiles", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clerk_session_store.set({ user_state: { status: "missing" } });
    is_clerk_loaded_store.set(false);
    get_authentication_adapter_mock.mockReturnValue({
      verify_token: verify_token_mock,
    });
  });

  const public_viewer_profile = create_profile({
    id: "public-viewer",
    role: "public_viewer",
  });
  const seeded_profile = create_profile({
    id: SEED_SYSTEM_USER_IDS.ORG_ADMIN_UGANDA_HOCKEY,
  });
  const real_profile = create_profile({ id: "k17abc_real_user" });

  it("offers only the public viewer and seeded demo users to an anonymous visitor", async () => {
    load_sidebar_menu_for_role_mock.mockResolvedValueOnce([]);

    const anonymous_state = await create_default_anonymous_state([
      public_viewer_profile,
      real_profile,
      seeded_profile,
    ] as UserProfile[]);

    expect(anonymous_state.available_profiles).toEqual([
      public_viewer_profile,
      seeded_profile,
    ]);
  });

  it("credits an anonymous visitor's changes to the public viewer", async () => {
    load_sidebar_menu_for_role_mock.mockResolvedValueOnce([]);

    await create_default_anonymous_state([public_viewer_profile]);

    expect(sync_user_context_with_event_bus_mock).toHaveBeenCalledWith({
      status: "present",
      profile: public_viewer_profile,
    });
  });

  it("does not restore an anonymous session into a real synced user", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    verify_token_mock.mockResolvedValueOnce({
      success: true,
      data: {
        is_valid: true,
        payload: create_auth_token(real_profile.id).payload,
      },
    });

    await expect(
      try_restore_anonymous_session(
        [public_viewer_profile, real_profile] as UserProfile[],
        "a.b.signature",
      ),
    ).resolves.toEqual({ status: "not_restored" });
    expect(clear_auth_storage_mock).toHaveBeenCalledTimes(1);
  });

  it("restores an anonymous session with only demo profiles available", async () => {
    verify_token_mock.mockResolvedValueOnce({
      success: true,
      data: {
        is_valid: true,
        payload: create_auth_token(seeded_profile.id).payload,
      },
    });
    load_sidebar_menu_for_role_mock.mockResolvedValueOnce([]);

    const restored = await try_restore_anonymous_session(
      [public_viewer_profile, real_profile, seeded_profile] as UserProfile[],
      "a.b.signature",
    );

    expect(restored).toEqual(
      expect.objectContaining({
        status: "restored",
        auth_state: expect.objectContaining({
          available_profiles: [public_viewer_profile, seeded_profile],
        }),
      }),
    );
  });
});

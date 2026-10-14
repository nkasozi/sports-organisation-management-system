import { get } from "svelte/store";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SEED_SYSTEM_USER_IDS } from "$lib/infrastructure/utils/seed/seedIds";

import {
  build_auth_state,
  build_auth_token,
  build_profile,
  import_auth_store,
  prepare_auth_store_core_test,
} from "./authStoreCore.test_support";
import { type AuthState, create_missing_auth_profile_state } from "./authTypes";

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

const REAL_SYNCED_USER_ID = "k17abc_real_user";

function initialize_with_state(state: Partial<AuthState>): boolean {
  auth_store_core_mocks.execute_auth_initialization.mockImplementation(
    async (_state: unknown, set_state: (state: AuthState) => void) => {
      set_state(build_auth_state({ is_initialized: true, ...state }));
      return { success: true, data: true };
    },
  );
  auth_store_core_mocks.generate_token_for_profile.mockResolvedValue({
    success: true,
    data: build_auth_token("new-token", "any"),
  });
  return true;
}

describe("switch_auth_profile demo enforcement", () => {
  beforeEach(() => {
    prepare_auth_store_core_test(auth_store_core_mocks);
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("refuses to switch profiles outside a demo session", async () => {
    const seeded_profile = build_profile({
      id: SEED_SYSTEM_USER_IDS.ORG_ADMIN_UGANDA_HOCKEY,
      role: "org_admin",
    });
    initialize_with_state({
      available_profiles: [seeded_profile],
      is_demo_session: false,
    });
    const { auth_store } = await import_auth_store();
    expect((await auth_store.initialize()).success).toBe(true);

    expect(await auth_store.switch_profile(seeded_profile.id)).toBe(false);

    expect(
      auth_store_core_mocks.generate_token_for_profile,
    ).not.toHaveBeenCalled();
    expect(auth_store_core_mocks.save_token).not.toHaveBeenCalled();
    expect(get(auth_store).current_profile).toEqual(
      create_missing_auth_profile_state(),
    );
  });

  it("refuses to switch a demo session into a real synced user", async () => {
    const real_profile = build_profile({
      id: REAL_SYNCED_USER_ID,
      role: "super_admin",
    });
    initialize_with_state({
      available_profiles: [real_profile],
      is_demo_session: true,
    });
    const { auth_store } = await import_auth_store();
    expect((await auth_store.initialize()).success).toBe(true);

    expect(await auth_store.switch_profile(REAL_SYNCED_USER_ID)).toBe(false);

    expect(
      auth_store_core_mocks.generate_token_for_profile,
    ).not.toHaveBeenCalled();
  });

  it("keeps only demo profiles when refreshing a demo session", async () => {
    const seeded_profile = build_profile({
      id: SEED_SYSTEM_USER_IDS.PLAYER_DENIS_ONYANGO,
      role: "player",
    });
    const real_profile = build_profile({ id: REAL_SYNCED_USER_ID });
    initialize_with_state({ available_profiles: [], is_demo_session: true });
    auth_store_core_mocks.load_profiles_from_repository.mockResolvedValue([
      seeded_profile,
      real_profile,
    ]);
    const { auth_store } = await import_auth_store();
    expect((await auth_store.initialize()).success).toBe(true);

    await auth_store.refresh_profiles();

    const profile_ids = get(auth_store).available_profiles.map(
      (profile) => profile.id,
    );
    expect(profile_ids).toContain(seeded_profile.id);
    expect(profile_ids).not.toContain(REAL_SYNCED_USER_ID);
  });
});

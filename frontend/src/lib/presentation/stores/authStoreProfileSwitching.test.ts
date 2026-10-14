import { get } from "svelte/store";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { auth_store, can_switch_profiles } from "./auth";
import {
  mock_app_settings_store,
  require_defined,
} from "./authStoreModuleMocks.test_support";

vi.mock("$lib/infrastructure/container", async () =>
  (
    await import("./authStoreModuleMocks.test_support")
  ).create_container_module_mock(),
);

vi.mock("$app/environment", () => ({
  browser: true,
}));

vi.mock("$app/navigation", () => ({
  goto: vi.fn(),
}));

vi.mock("$lib/adapters/initialization/brandingSyncService", () => ({
  sync_branding_with_profile: vi.fn().mockImplementation(async () => {}),
}));

vi.mock("$lib/infrastructure/sync/convexSyncService", async () =>
  (
    await import("./authStoreModuleMocks.test_support")
  ).create_convex_sync_service_module_mock(),
);

vi.mock("$lib/adapters/iam/clerkAuthService", async () =>
  (
    await import("./authStoreModuleMocks.test_support")
  ).create_clerk_auth_service_module_mock(),
);

vi.mock("./profileLoader", async () =>
  (
    await import("./authStoreModuleMocks.test_support")
  ).create_profile_loader_module_mock(),
);

describe("auth_store integration", () => {
  beforeEach(async () => {
    Object.keys(mock_app_settings_store).forEach(
      (key) => delete mock_app_settings_store[key],
    );
    expect((await auth_store.initialize()).success).toBe(true);
  });

  afterEach(async () => {
    await auth_store.logout();
  });

  describe("get_authorization_level", () => {
    it("returns authorization map for entity type", async () => {
      const profiles = get(auth_store).available_profiles;
      const super_admin_profile = profiles.find(
        (p) => p.role === "super_admin",
      );

      await auth_store.switch_profile(require_defined(super_admin_profile).id);
      const auth_level = auth_store.get_authorization_level("team");

      expect(auth_level.entity_type).toBe("team");
      expect(auth_level.authorizations).toBeDefined();
    });

    it("super_admin has all CRUD permissions for teams", async () => {
      const profiles = get(auth_store).available_profiles;
      const super_admin_profile = profiles.find(
        (p) => p.role === "super_admin",
      );

      await auth_store.switch_profile(require_defined(super_admin_profile).id);
      const auth_level = auth_store.get_authorization_level("team");

      expect(auth_level.authorizations.get("create")).toBe("full");
      expect(auth_level.authorizations.get("list")).toBe("full");
      expect(auth_level.authorizations.get("edit")).toBe("full");
      expect(auth_level.authorizations.get("delete")).toBe("full");
    });

    it("player cannot create/delete teams but can view", async () => {
      auth_store.mark_as_demo_session();
      const profiles = get(auth_store).available_profiles;
      const player_profile = profiles.find((p) => p.role === "player");

      await auth_store.switch_profile(require_defined(player_profile).id);
      const auth_level = auth_store.get_authorization_level("team");

      expect(auth_level.authorizations.get("create")).toBe("none");
      expect(auth_level.authorizations.get("list")).toBe("full");
      expect(auth_level.authorizations.get("delete")).toBe("none");
    });
  });
  describe("can_switch_profiles derived store", () => {
    it("returns false after initialization in signed-in mode", () => {
      expect(get(can_switch_profiles)).toBe(false);
    });

    it("returns false when no profile is set", async () => {
      await auth_store.logout();
      expect(get(can_switch_profiles)).toBe(false);
    });

    it("returns true when explicitly in demo session as public_viewer", async () => {
      auth_store.mark_as_demo_session();
      const profiles = get(auth_store).available_profiles;
      const public_viewer_profile = profiles.find(
        (p) => p.role === "public_viewer",
      );
      await auth_store.switch_profile(
        require_defined(public_viewer_profile).id,
      );
      expect(get(can_switch_profiles)).toBe(true);
    });

    it("stays true in demo session when switching to super_admin demo", async () => {
      auth_store.mark_as_demo_session();
      const profiles = get(auth_store).available_profiles;
      const super_admin_profile = profiles.find(
        (p) => p.role === "super_admin",
      );
      await auth_store.switch_profile(require_defined(super_admin_profile).id);
      expect(get(can_switch_profiles)).toBe(true);
    });

    it("stays true in demo session when switching to org_admin demo", async () => {
      auth_store.mark_as_demo_session();
      const profiles = get(auth_store).available_profiles;
      const org_admin_profile = profiles.find((p) => p.role === "org_admin");
      await auth_store.switch_profile(require_defined(org_admin_profile).id);
      expect(get(can_switch_profiles)).toBe(true);
    });

    it("stays true in demo session when switching to team_manager demo", async () => {
      auth_store.mark_as_demo_session();
      const profiles = get(auth_store).available_profiles;
      const team_manager_profile = profiles.find(
        (p) => p.role === "team_manager",
      );
      await auth_store.switch_profile(require_defined(team_manager_profile).id);
      expect(get(can_switch_profiles)).toBe(true);
    });

    it("stays true in demo session when switching to player demo", async () => {
      auth_store.mark_as_demo_session();
      const profiles = get(auth_store).available_profiles;
      const player_profile = profiles.find((p) => p.role === "player");
      await auth_store.switch_profile(require_defined(player_profile).id);
      expect(get(can_switch_profiles)).toBe(true);
    });

    it("stays true in demo session when switching to official demo", async () => {
      auth_store.mark_as_demo_session();
      const profiles = get(auth_store).available_profiles;
      const official_profile = profiles.find((p) => p.role === "official");
      await auth_store.switch_profile(require_defined(official_profile).id);
      expect(get(can_switch_profiles)).toBe(true);
    });

    it("stays true across multiple demo profile switches", async () => {
      auth_store.mark_as_demo_session();
      const profiles = get(auth_store).available_profiles;
      const super_admin_profile = profiles.find(
        (p) => p.role === "super_admin",
      );
      const player_profile = profiles.find((p) => p.role === "player");

      await auth_store.switch_profile(require_defined(super_admin_profile).id);
      expect(get(can_switch_profiles)).toBe(true);

      await auth_store.switch_profile(require_defined(player_profile).id);
      expect(get(can_switch_profiles)).toBe(true);
    });

    it("returns false after logout even when previously in demo mode", async () => {
      auth_store.mark_as_demo_session();
      await auth_store.logout();
      expect(get(can_switch_profiles)).toBe(false);
    });
  });
});

import { get } from "svelte/store";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  auth_store,
  current_profile_display_name,
  current_user_role,
  current_user_role_display,
} from "./auth";
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
    auth_store.mark_as_demo_session();
  });

  afterEach(async () => {
    await auth_store.logout();
  });

  describe("current_user_role derived store", () => {
    it("returns an empty role when no profile is set", async () => {
      await auth_store.logout();
      const role = get(current_user_role);
      expect(role).toBe("");
    });

    it("returns correct role after profile switch", async () => {
      const profiles = get(auth_store).available_profiles;
      const team_manager_profile = profiles.find(
        (p) => p.role === "team_manager",
      );

      await auth_store.switch_profile(require_defined(team_manager_profile).id);
      const role = get(current_user_role);

      expect(role).toBe("team_manager");
    });

    it("updates role when switching between profiles", async () => {
      const profiles = get(auth_store).available_profiles;
      const super_admin_profile = profiles.find(
        (p) => p.role === "super_admin",
      );
      const player_profile = profiles.find((p) => p.role === "player");

      await auth_store.switch_profile(require_defined(super_admin_profile).id);
      expect(get(current_user_role)).toBe("super_admin");

      await auth_store.switch_profile(require_defined(player_profile).id);
      expect(get(current_user_role)).toBe("player");
    });
  });

  describe("current_user_role_display derived store", () => {
    it("returns Unknown when no profile is set", async () => {
      await auth_store.logout();
      const display = get(current_user_role_display);
      expect(display).toBe("Unknown");
    });

    it("returns human-readable role name", async () => {
      const profiles = get(auth_store).available_profiles;
      const super_admin_profile = profiles.find(
        (p) => p.role === "super_admin",
      );

      await auth_store.switch_profile(require_defined(super_admin_profile).id);
      const display = get(current_user_role_display);

      expect(display).toBe("Super Admin");
    });
  });

  describe("current_profile_display_name derived store", () => {
    it("returns Guest when no profile is set", async () => {
      await auth_store.logout();
      const name = get(current_profile_display_name);
      expect(name).toBe("Guest");
    });

    it("returns profile display name after switch", async () => {
      const profiles = get(auth_store).available_profiles;
      const player_profile = profiles.find((p) => p.role === "player");

      await auth_store.switch_profile(require_defined(player_profile).id);
      const name = get(current_profile_display_name);

      expect(name).toBe(require_defined(player_profile).display_name);
    });
  });

  describe("available_profiles", () => {
    it("contains all expected roles", () => {
      const profiles = get(auth_store).available_profiles;
      const roles = profiles.map((p) => p.role);

      expect(roles).toContain("super_admin");
      expect(roles).toContain("org_admin");
      expect(roles).toContain("officials_manager");
      expect(roles).toContain("team_manager");
      expect(roles).toContain("official");
      expect(roles).toContain("player");
    });

    it("each profile has required fields", () => {
      const profiles = get(auth_store).available_profiles;

      for (const profile of profiles) {
        expect(profile.id).toBeDefined();
        expect(profile.display_name).toBeDefined();
        expect(profile.email).toBeDefined();
        expect(profile.role).toBeDefined();
        expect(profile.organization_id).toBeDefined();
        expect(profile.team_id).toBeDefined();
      }
    });
  });

  describe("switch_profile", () => {
    it("returns true for valid profile id", async () => {
      const profiles = get(auth_store).available_profiles;
      const result = await auth_store.switch_profile(profiles[0].id);
      expect(result).toBe(true);
    });

    it("returns false for invalid profile id", async () => {
      const result = await auth_store.switch_profile("non-existent-profile-id");
      expect(result).toBe(false);
    });

    it("updates current_profile in state", async () => {
      const profiles = get(auth_store).available_profiles;
      const target_profile = profiles.find((p) => p.role === "official");

      await auth_store.switch_profile(require_defined(target_profile).id);
      const state = get(auth_store);

      expect(state.current_profile.status).toBe("present");
      if (state.current_profile.status === "present") {
        expect(state.current_profile.profile.id).toBe(
          require_defined(target_profile).id,
        );
        expect(state.current_profile.profile.role).toBe("official");
      }
    });
  });
});

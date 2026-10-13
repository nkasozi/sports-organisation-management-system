import { get } from "svelte/store";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { get_sidebar_menu_for_role } from "$lib/adapters/iam/LocalAuthorizationAdapter";

import { auth_store, sidebar_menu_items } from "./auth";
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

  describe("sidebar_menu_items derived store", () => {
    it("returns empty array when no profile is set", async () => {
      await auth_store.logout();
      const menu = get(sidebar_menu_items);
      expect(menu).toEqual([]);
    });

    it("returns menu items for super_admin profile", async () => {
      const profiles = get(auth_store).available_profiles;
      const super_admin_profile = profiles.find(
        (p) => p.role === "super_admin",
      );
      expect(super_admin_profile).toBeDefined();

      await auth_store.switch_profile(require_defined(super_admin_profile).id);

      const menu = get(sidebar_menu_items);
      const expected_menu = get_sidebar_menu_for_role("super_admin");

      expect(menu.length).toBe(expected_menu.length);
      expect(menu).toEqual(expected_menu);
    });

    it("returns different menu items for player profile", async () => {
      const profiles = get(auth_store).available_profiles;
      const player_profile = profiles.find((p) => p.role === "player");
      expect(player_profile).toBeDefined();

      await auth_store.switch_profile(require_defined(player_profile).id);

      const menu = get(sidebar_menu_items);
      const expected_menu = get_sidebar_menu_for_role("player");

      expect(menu).toEqual(expected_menu);
    });

    it("updates menu when profile is switched from super_admin to player", async () => {
      const profiles = get(auth_store).available_profiles;
      const super_admin_profile = profiles.find(
        (p) => p.role === "super_admin",
      );
      const player_profile = profiles.find((p) => p.role === "player");

      await auth_store.switch_profile(require_defined(super_admin_profile).id);
      const super_admin_menu = get(sidebar_menu_items);
      const super_admin_menu_length = super_admin_menu.length;

      await auth_store.switch_profile(require_defined(player_profile).id);
      const player_menu = get(sidebar_menu_items);
      const player_menu_length = player_menu.length;

      expect(super_admin_menu_length).toBeGreaterThan(0);
      expect(player_menu_length).toBeGreaterThan(0);
    });

    it("super_admin menu includes settings-related items that player menu does not", async () => {
      const profiles = get(auth_store).available_profiles;
      const super_admin_profile = profiles.find(
        (p) => p.role === "super_admin",
      );
      const player_profile = profiles.find((p) => p.role === "player");

      await auth_store.switch_profile(require_defined(super_admin_profile).id);
      const super_admin_items = get(sidebar_menu_items).flatMap((g) => g.items);

      await auth_store.switch_profile(require_defined(player_profile).id);
      const player_items = get(sidebar_menu_items).flatMap((g) => g.items);

      const super_admin_has_settings = super_admin_items.some(
        (item) => item.href === "/settings" || item.href === "/system-users",
      );
      const player_has_settings = player_items.some(
        (item) => item.href === "/settings" || item.href === "/system-users",
      );

      expect(super_admin_has_settings).toBe(true);
      expect(player_has_settings).toBe(false);
    });
  });
});

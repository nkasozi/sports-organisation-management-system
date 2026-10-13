import { describe, expect, it } from "vitest";

import type { SidebarMenuGroup } from "$lib/core/interfaces/ports";

import { LocalAuthorizationAdapter } from "./LocalAuthorizationAdapter";
import {
  create_mock_auth_port,
  create_mock_system_user_repository,
} from "./LocalAuthorizationAdapter.test_support";

describe("LocalAuthorizationAdapter", () => {
  describe("get_sidebar_menu_for_profile", () => {
    it("should return full menu for super_admin", async () => {
      const mock_auth = create_mock_auth_port("super_admin@test.com");
      const mock_repo = create_mock_system_user_repository("super_admin");
      const adapter = new LocalAuthorizationAdapter(mock_auth, mock_repo);

      const result = await adapter.get_sidebar_menu_for_profile("valid-token");

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.length).toBeGreaterThan(0);
        const administration_group = result.data.find(
          (group: SidebarMenuGroup) => group.group_name === "Administration",
        );
        expect(administration_group).toBeDefined();
        const audit_trail_item = administration_group?.items.find(
          (item) => item.name === "Audit Trail",
        );
        expect(audit_trail_item).toBeDefined();
      }
    });

    it("should return limited menu for player", async () => {
      const mock_auth = create_mock_auth_port("player@test.com");
      const mock_repo = create_mock_system_user_repository("player");
      const adapter = new LocalAuthorizationAdapter(mock_auth, mock_repo);

      const result = await adapter.get_sidebar_menu_for_profile("valid-token");

      expect(result.success).toBe(true);
      if (result.success) {
        const administration_group = result.data.find(
          (group: SidebarMenuGroup) => group.group_name === "Administration",
        );
        expect(Boolean(administration_group)).toBe(false);
        const my_info_group = result.data.find(
          (group: SidebarMenuGroup) => group.group_name === "My Info",
        );
        expect(my_info_group).toBeDefined();
      }
    });

    it("should return failure for invalid token", async () => {
      const mock_auth = create_mock_auth_port("player@test.com", false);
      const mock_repo = create_mock_system_user_repository("player");
      const adapter = new LocalAuthorizationAdapter(mock_auth, mock_repo);

      const result =
        await adapter.get_sidebar_menu_for_profile("invalid-token");

      expect(result.success).toBe(false);
    });
  });

  describe("can_profile_access_route", () => {
    it("should allow super_admin to access system-users route", async () => {
      const mock_auth = create_mock_auth_port("super_admin@test.com");
      const mock_repo = create_mock_system_user_repository("super_admin");
      const adapter = new LocalAuthorizationAdapter(mock_auth, mock_repo);

      const result = await adapter.can_profile_access_route(
        "valid-token",
        "/system-users",
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.route).toBe("/system-users");
        expect(result.data.all_accessible_routes.length).toBeGreaterThan(0);
      }
    });

    it("should allow org_admin to access settings", async () => {
      const mock_auth = create_mock_auth_port("org_admin@test.com");
      const mock_repo = create_mock_system_user_repository("org_admin");
      const adapter = new LocalAuthorizationAdapter(mock_auth, mock_repo);

      const result = await adapter.can_profile_access_route(
        "valid-token",
        "/settings",
      );

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.all_accessible_routes.length).toBeGreaterThan(0);
      }
    });

    it("should deny player access to settings", async () => {
      const mock_auth = create_mock_auth_port("player@test.com");
      const mock_repo = create_mock_system_user_repository("player");
      const adapter = new LocalAuthorizationAdapter(mock_auth, mock_repo);

      const result = await adapter.can_profile_access_route(
        "valid-token",
        "/settings",
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.route).toBe("/settings");
        expect(result.error.message).toContain("does not have access");
      }
    });

    it("should allow all roles to access home route", async () => {
      const mock_auth = create_mock_auth_port("player@test.com");
      const mock_repo = create_mock_system_user_repository("player");
      const adapter = new LocalAuthorizationAdapter(mock_auth, mock_repo);

      const result = await adapter.can_profile_access_route("valid-token", "/");

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.all_accessible_routes.length).toBeGreaterThan(0);
      }
    });

    it("should return failure for invalid token", async () => {
      const mock_auth = create_mock_auth_port("player@test.com", false);
      const mock_repo = create_mock_system_user_repository("player");
      const adapter = new LocalAuthorizationAdapter(mock_auth, mock_repo);

      const result = await adapter.can_profile_access_route(
        "invalid-token",
        "/",
      );

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain("Invalid or expired");
      }
    });
  });
});

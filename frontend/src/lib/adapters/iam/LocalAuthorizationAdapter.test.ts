import { describe, expect, it } from "vitest";

import { LocalAuthorizationAdapter } from "./LocalAuthorizationAdapter";
import {
  create_mock_auth_port,
  create_mock_system_user_repository,
} from "./LocalAuthorizationAdapter.test_support";

describe("LocalAuthorizationAdapter", () => {
  describe("get_profile_permissions", () => {
    it("should return full permissions for super_admin", async () => {
      const mock_auth = create_mock_auth_port("super_admin@test.com");
      const mock_repo = create_mock_system_user_repository("super_admin");
      const adapter = new LocalAuthorizationAdapter(mock_auth, mock_repo);

      const result = await adapter.get_profile_permissions("valid-token");

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.role).toBe("super_admin");
        expect(result.data.permissions.root_level.create).toBe(true);
        expect(result.data.permissions.root_level.read).toBe(true);
        expect(result.data.permissions.root_level.update).toBe(true);
        expect(result.data.permissions.root_level.delete).toBe(true);
        expect(result.data.permissions.org_administrator_level.create).toBe(
          true,
        );
        expect(result.data.permissions.organisation_level.create).toBe(true);
        expect(result.data.permissions.team_level.create).toBe(true);
        expect(result.data.permissions.player_level.create).toBe(true);
      }
    });

    it("should return read-only root permissions for org_admin", async () => {
      const mock_auth = create_mock_auth_port("org_admin@test.com");
      const mock_repo = create_mock_system_user_repository("org_admin");
      const adapter = new LocalAuthorizationAdapter(mock_auth, mock_repo);

      const result = await adapter.get_profile_permissions("valid-token");

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.role).toBe("org_admin");
        expect(result.data.permissions.root_level.create).toBe(false);
        expect(result.data.permissions.root_level.read).toBe(true);
        expect(result.data.permissions.root_level.update).toBe(false);
        expect(result.data.permissions.org_administrator_level.create).toBe(
          true,
        );
        expect(result.data.permissions.organisation_level.create).toBe(true);
      }
    });

    it("should return limited permissions for player", async () => {
      const mock_auth = create_mock_auth_port("player@test.com");
      const mock_repo = create_mock_system_user_repository("player");
      const adapter = new LocalAuthorizationAdapter(mock_auth, mock_repo);

      const result = await adapter.get_profile_permissions("valid-token");

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.role).toBe("player");
        expect(result.data.permissions.root_level.create).toBe(false);
        expect(result.data.permissions.org_administrator_level.create).toBe(
          false,
        );
        expect(result.data.permissions.player_level.create).toBe(false);
        expect(result.data.permissions.player_level.read).toBe(true);
        expect(result.data.permissions.player_level.update).toBe(true);
        expect(result.data.permissions.player_level.delete).toBe(false);
        expect(result.data.permissions.public_level.create).toBe(true);
        expect(result.data.permissions.public_level.read).toBe(true);
        expect(result.data.permissions.public_level.update).toBe(true);
        expect(result.data.permissions.public_level.delete).toBe(true);
      }
    });

    it("should return failure for invalid token", async () => {
      const mock_auth = create_mock_auth_port(
        "player@test.com",
        false,
        "Token is invalid",
      );
      const mock_repo = create_mock_system_user_repository("player");
      const adapter = new LocalAuthorizationAdapter(mock_auth, mock_repo);

      const result = await adapter.get_profile_permissions("invalid-token");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.failure_type).toBe("token_invalid");
        expect(result.error.message).toContain("Token");
      }
    });

    it("should return token_expired failure for expired token", async () => {
      const mock_auth = create_mock_auth_port(
        "player@test.com",
        false,
        "Token has expired",
      );
      const mock_repo = create_mock_system_user_repository("player");
      const adapter = new LocalAuthorizationAdapter(mock_auth, mock_repo);

      const result = await adapter.get_profile_permissions("expired-token");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.failure_type).toBe("token_expired");
      }
    });
  });
});

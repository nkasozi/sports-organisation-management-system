import { describe, expect, it, vi } from "vitest";

import {
  load_live_games_permissions,
  validate_live_games_start_permission,
} from "./liveGamesAccessLogic";

describe("liveGamesAccessLogic", () => {
  it("builds denial and permission state from authorization responses", async () => {
    const adapter = {
      check_entity_authorized: async (
        _raw_token: string,
        _entity: string,
        action: string,
      ) => {
        if (action === "read") {
          return {
            success: true,
            data: { is_authorized: true, role: "viewer" },
          };
        }
        return {
          success: true,
          data: { is_authorized: false, role: "viewer" },
        };
      },
    };

    const result = await load_live_games_permissions("token", adapter);

    expect(result.authorization_succeeded).toBe(true);
    expect(result.is_read_authorized).toBe(true);
    expect(result.can_start_games).toBe(false);
    expect(result.permission_info_message).toContain("viewer");
  });

  it("returns the start permission error when update authorization is denied", async () => {
    const adapter = {
      check_entity_authorized: async () => ({
        success: true,
        data: { is_authorized: false, role: "viewer" },
      }),
    };

    const result = await validate_live_games_start_permission("token", adapter);

    expect(result).toContain("Permission denied");
  });

  it("fails closed with a friendly message when the start permission check fails", async () => {
    const error_spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const adapter = {
      check_entity_authorized: async () => ({ success: false }),
    };

    const result = await validate_live_games_start_permission("token", adapter);

    expect(result).toBe(
      "We could not verify your permission to start games. Please try again.",
    );
    expect(error_spy).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        event: "live_games_start_permission_check_failed",
      }),
    );
  });

  it("allows starting games only when update authorization succeeds and is granted", async () => {
    const adapter = {
      check_entity_authorized: async () => ({
        success: true,
        data: { is_authorized: true, role: "org_admin" },
      }),
    };

    const result = await validate_live_games_start_permission("token", adapter);

    expect(result).toBe("");
  });

  it("logs a structured error when the read permission check fails", async () => {
    const error_spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const adapter = {
      check_entity_authorized: async () => ({ success: false }),
    };

    const result = await load_live_games_permissions("token", adapter);

    expect(result.authorization_succeeded).toBe(false);
    expect(result.is_read_authorized).toBe(false);
    expect(error_spy).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        event: "live_games_read_permission_check_failed",
      }),
    );
  });
});

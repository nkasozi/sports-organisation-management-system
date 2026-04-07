import { describe, expect, it } from "vitest";

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
});

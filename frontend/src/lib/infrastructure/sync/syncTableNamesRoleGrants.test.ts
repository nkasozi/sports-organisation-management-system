import { describe, expect, it } from "vitest";

import { role_can_push_operation } from "./syncTableNames";

const PushOperation = { UPSERT: "upsert", DELETE: "delete" } as const;

describe("role_can_push_operation for entity role grants", () => {
  it("lets team managers push new memberships", () => {
    expect(
      role_can_push_operation(
        "team_manager",
        "player_team_memberships",
        PushOperation.UPSERT,
      ),
    ).toBe(true);
  });

  it("lets officials push live game logs and game event logs", () => {
    for (const table_name of ["live_game_logs", "game_event_logs"])
      expect(
        role_can_push_operation("official", table_name, PushOperation.UPSERT),
      ).toBe(true);
  });

  it("keeps officials from deleting live game logs", () => {
    expect(
      role_can_push_operation(
        "official",
        "live_game_logs",
        PushOperation.DELETE,
      ),
    ).toBe(false);
  });
});

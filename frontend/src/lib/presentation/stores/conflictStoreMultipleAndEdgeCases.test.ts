import { describe, expect, it, vi } from "vitest";

import {
  create_entity_id,
  create_mock_conflict,
  get_resolved_data_for_action,
} from "./conflictStore.test_support";

vi.mock("$lib/infrastructure/sync/conflictAuditService", () => ({
  log_conflict_detected: vi.fn().mockResolvedValue(true),
  log_conflict_resolution: vi.fn().mockResolvedValue(true),
}));

describe("Multiple conflicts handling", () => {
  it("conflicts can have different ids when created with different local_ids", () => {
    const conflicts = [
      create_mock_conflict({
        id: "conflict_teams_team_1_111",
        local_id: create_entity_id("team_1"),
      }),
      create_mock_conflict({
        id: "conflict_teams_team_2_222",
        local_id: create_entity_id("team_2"),
      }),
      create_mock_conflict({
        id: "conflict_teams_team_3_333",
        local_id: create_entity_id("team_3"),
      }),
    ];

    const ids = conflicts.map((c) => c.id);
    const unique_ids = new Set(ids);

    expect(unique_ids.size).toBe(3);
  });

  it("can have conflicts from different tables", () => {
    const conflicts = [
      create_mock_conflict({
        table_name: "teams",
        local_id: create_entity_id("team_1"),
      }),
      create_mock_conflict({
        table_name: "players",
        local_id: create_entity_id("player_1"),
      }),
      create_mock_conflict({
        table_name: "officials",
        local_id: create_entity_id("official_1"),
      }),
    ];

    const table_names = conflicts.map((c) => c.table_name);

    expect(table_names).toContain("teams");
    expect(table_names).toContain("players");
    expect(table_names).toContain("officials");
  });
});

describe("Edge cases", () => {
  it("handles conflict with empty local data", () => {
    const conflict = create_mock_conflict({
      local_data: {},
      remote_data: { name: "Remote Only" },
    });

    const result = get_resolved_data_for_action(conflict, "keep_local");

    expect(result.updated_at).toBeDefined();
  });

  it("handles conflict with empty remote data", () => {
    const conflict = create_mock_conflict({
      local_data: { name: "Local Only" },
      remote_data: {},
    });

    const result = get_resolved_data_for_action(conflict, "keep_remote");

    expect(result).toEqual({});
  });

  it("handles conflict with null values in data", () => {
    const conflict = create_mock_conflict({
      local_data: { name: JSON.parse("null"), city: "Kampala" },
      remote_data: { name: "Remote Name", city: JSON.parse("null") },
    });

    const result_local = get_resolved_data_for_action(conflict, "keep_local");
    const result_remote = get_resolved_data_for_action(conflict, "keep_remote");

    expect(result_local.name).toBeNull();
    expect(result_local.city).toBe("Kampala");
    expect(result_remote.name).toBe("Remote Name");
    expect(result_remote.city).toBeNull();
  });

  it("handles conflict with nested objects", () => {
    const conflict = create_mock_conflict({
      local_data: {
        metadata: { color: "red", tags: ["a", "b"] },
      },
      remote_data: {
        metadata: { color: "blue", tags: ["c", "d"] },
      },
    });

    const result = get_resolved_data_for_action(conflict, "keep_local");

    expect(result.metadata).toEqual({ color: "red", tags: ["a", "b"] });
  });

  it("handles conflict with arrays", () => {
    const conflict = create_mock_conflict({
      local_data: { players: ["player_1", "player_2"] },
      remote_data: { players: ["player_3", "player_4"] },
    });

    const result = get_resolved_data_for_action(conflict, "keep_remote");

    expect(result.players).toEqual(["player_3", "player_4"]);
  });

  it("handles conflict where only timestamps differ", () => {
    const conflict = create_mock_conflict({
      local_data: { name: "Same Name" },
      remote_data: { name: "Same Name" },
      field_differences: [],
    });

    expect(conflict.field_differences).toHaveLength(0);
  });
});

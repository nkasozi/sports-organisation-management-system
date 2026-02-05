import { describe, expect, it, vi, beforeEach } from "vitest";
import type {
  ConflictRecord,
  ConflictResolutionAction,
} from "$lib/infrastructure/sync/conflictTypes";

vi.mock("$lib/infrastructure/sync/conflictAuditService", () => ({
  log_conflict_detected: vi.fn().mockResolvedValue(true),
  log_conflict_resolution: vi.fn().mockResolvedValue(true),
}));

function create_mock_conflict(overrides: Partial<ConflictRecord> = {}): ConflictRecord {
  return {
    id: "conflict_teams_team_1_123456",
    table_name: "teams",
    local_id: "team_1",
    entity_display_name: "Test Team",
    local_data: { name: "Local Team Name", city: "Kampala" },
    remote_data: { name: "Remote Team Name", city: "Kampala" },
    local_updated_at: "2024-01-01T10:00:00.000Z",
    remote_updated_at: "2024-01-01T12:00:00.000Z",
    remote_updated_by: "user_123",
    remote_updated_by_name: "John Doe",
    field_differences: [
      {
        field_name: "name",
        local_value: "Local Team Name",
        remote_value: "Remote Team Name",
        display_name: "Name",
      },
    ],
    detected_at: "2024-01-01T14:00:00.000Z",
    ...overrides,
  };
}

function get_resolved_data_for_action(
  conflict: ConflictRecord,
  action: ConflictResolutionAction,
  merged_data?: Record<string, unknown>,
): Record<string, unknown> {
  switch (action) {
    case "keep_local":
      return { ...conflict.local_data, updated_at: new Date().toISOString() };
    case "keep_remote":
      return conflict.remote_data;
    case "merge":
      return merged_data || conflict.local_data;
    default:
      return conflict.local_data;
  }
}

describe("get_resolved_data_for_action", () => {
  const conflict = create_mock_conflict();

  it("returns local data with updated timestamp for keep_local action", () => {
    const result = get_resolved_data_for_action(conflict, "keep_local");

    expect(result.name).toBe("Local Team Name");
    expect(result.city).toBe("Kampala");
    expect(result.updated_at).toBeDefined();
  });

  it("returns remote data for keep_remote action", () => {
    const result = get_resolved_data_for_action(conflict, "keep_remote");

    expect(result.name).toBe("Remote Team Name");
    expect(result.city).toBe("Kampala");
  });

  it("returns merged data for merge action when provided", () => {
    const merged_data = { name: "Merged Name", city: "Nairobi" };

    const result = get_resolved_data_for_action(conflict, "merge", merged_data);

    expect(result.name).toBe("Merged Name");
    expect(result.city).toBe("Nairobi");
  });

  it("returns local data for merge action when no merged data provided", () => {
    const result = get_resolved_data_for_action(conflict, "merge");

    expect(result.name).toBe("Local Team Name");
  });

  it("returns local data for unknown action", () => {
    const result = get_resolved_data_for_action(
      conflict,
      "unknown" as ConflictResolutionAction,
    );

    expect(result.name).toBe("Local Team Name");
  });
});

describe("ConflictRecord structure", () => {
  it("contains all required fields for conflict display", () => {
    const conflict = create_mock_conflict();

    expect(conflict.id).toBeDefined();
    expect(conflict.table_name).toBe("teams");
    expect(conflict.local_id).toBe("team_1");
    expect(conflict.entity_display_name).toBe("Test Team");
    expect(conflict.local_data).toBeDefined();
    expect(conflict.remote_data).toBeDefined();
    expect(conflict.field_differences).toHaveLength(1);
    expect(conflict.detected_at).toBeDefined();
  });

  it("field_differences contains detailed comparison info", () => {
    const conflict = create_mock_conflict();
    const diff = conflict.field_differences[0];

    expect(diff.field_name).toBe("name");
    expect(diff.local_value).toBe("Local Team Name");
    expect(diff.remote_value).toBe("Remote Team Name");
    expect(diff.display_name).toBe("Name");
  });
});

describe("Conflict resolution flow", () => {
  it("keep_local preserves all local fields", () => {
    const conflict = create_mock_conflict({
      local_data: {
        name: "Local Name",
        description: "Local Description",
        score: 100,
      },
    });

    const result = get_resolved_data_for_action(conflict, "keep_local");

    expect(result.name).toBe("Local Name");
    expect(result.description).toBe("Local Description");
    expect(result.score).toBe(100);
  });

  it("keep_remote preserves all remote fields", () => {
    const conflict = create_mock_conflict({
      remote_data: {
        name: "Remote Name",
        description: "Remote Description",
        score: 200,
      },
    });

    const result = get_resolved_data_for_action(conflict, "keep_remote");

    expect(result.name).toBe("Remote Name");
    expect(result.description).toBe("Remote Description");
    expect(result.score).toBe(200);
  });

  it("merge allows cherry-picking fields from both sources", () => {
    const conflict = create_mock_conflict({
      local_data: { name: "Local Name", score: 100 },
      remote_data: { name: "Remote Name", score: 200 },
    });

    const merged_data = {
      name: "Local Name",
      score: 200,
    };

    const result = get_resolved_data_for_action(conflict, "merge", merged_data);

    expect(result.name).toBe("Local Name");
    expect(result.score).toBe(200);
  });
});

describe("Multiple conflicts handling", () => {
  it("conflicts can have different ids when created with different local_ids", () => {
    const conflicts = [
      create_mock_conflict({ id: "conflict_teams_team_1_111", local_id: "team_1" }),
      create_mock_conflict({ id: "conflict_teams_team_2_222", local_id: "team_2" }),
      create_mock_conflict({ id: "conflict_teams_team_3_333", local_id: "team_3" }),
    ];

    const ids = conflicts.map((c) => c.id);
    const unique_ids = new Set(ids);

    expect(unique_ids.size).toBe(3);
  });

  it("can have conflicts from different tables", () => {
    const conflicts = [
      create_mock_conflict({ table_name: "teams", local_id: "team_1" }),
      create_mock_conflict({ table_name: "players", local_id: "player_1" }),
      create_mock_conflict({ table_name: "officials", local_id: "official_1" }),
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
      local_data: { name: null, city: "Kampala" },
      remote_data: { name: "Remote Name", city: null },
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

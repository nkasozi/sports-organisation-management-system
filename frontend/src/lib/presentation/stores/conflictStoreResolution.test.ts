import { describe, expect, it, vi } from "vitest";

import { type ConflictResolutionAction } from "$lib/infrastructure/sync/conflictTypes";

import {
  create_mock_conflict,
  get_resolved_data_for_action,
} from "./conflictStore.test_support";

vi.mock("$lib/infrastructure/sync/conflictAuditService", () => ({
  log_conflict_detected: vi.fn().mockResolvedValue(true),
  log_conflict_resolution: vi.fn().mockResolvedValue(true),
}));

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

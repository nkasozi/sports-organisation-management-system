import { describe, expect, it, vi } from "vitest";

import { create_pending_team_conflict } from "./syncStore.test_support";
import {
  apply_conflict_resolution_outcome,
  type ConflictOutcomeDependencies,
  ConflictResolutionFeedbackStatus,
} from "./syncStoreConflictOutcome";

function create_dependencies(
  overrides: Partial<ConflictOutcomeDependencies> = {},
): ConflictOutcomeDependencies {
  return {
    mark_resolved: vi.fn(() => true),
    refresh_remote_copy: vi.fn(() => true),
    remove_conflict: vi.fn(() => true),
    add_remote_deletion: vi.fn(() => true),
    load_server_copy: vi.fn(async () => ({
      success: true as const,
      data: { status: "found" as const, record: { name: "Newest" } },
    })),
    ...overrides,
  };
}

const CONFLICT = create_pending_team_conflict("team-2");

describe("apply_conflict_resolution_outcome", () => {
  it("marks the conflict resolved when the server accepted the choice", async () => {
    const dependencies = create_dependencies();

    const feedback = await apply_conflict_resolution_outcome(dependencies, {
      conflict: CONFLICT,
      action: "keep_local",
      merged_data: {},
      outcome: { kind: "resolved", server_version: 3 },
    });

    expect(feedback.status).toBe(ConflictResolutionFeedbackStatus.RESOLVED);
    expect(dependencies.mark_resolved).toHaveBeenCalledWith(
      CONFLICT.id,
      "keep_local",
      {},
    );
  });

  it("keeps the conflict and loads the newest server copy when the record changed again", async () => {
    const dependencies = create_dependencies();

    const feedback = await apply_conflict_resolution_outcome(dependencies, {
      conflict: CONFLICT,
      action: "keep_local",
      merged_data: {},
      outcome: { kind: "remote_changed_again", server_version: 7 },
    });

    expect(feedback.status).toBe(
      ConflictResolutionFeedbackStatus.NEEDS_ATTENTION,
    );
    expect(dependencies.refresh_remote_copy).toHaveBeenCalledWith(
      CONFLICT.id,
      { name: "Newest" },
      7,
    );
    expect(dependencies.mark_resolved).not.toHaveBeenCalled();
  });

  it("moves the conflict to the review list when the record was deleted on the server", async () => {
    const dependencies = create_dependencies();

    const feedback = await apply_conflict_resolution_outcome(dependencies, {
      conflict: CONFLICT,
      action: "keep_local",
      merged_data: {},
      outcome: { kind: "deleted_remotely", tombstone_version: 9 },
    });

    expect(feedback.status).toBe(
      ConflictResolutionFeedbackStatus.MOVED_TO_REVIEW,
    );
    expect(dependencies.remove_conflict).toHaveBeenCalledWith(CONFLICT.id);
    expect(dependencies.add_remote_deletion).toHaveBeenCalledWith(
      expect.objectContaining({
        table_name: "teams",
        local_id: "team-2",
        tombstone_version: 9,
      }),
    );
  });

  it("keeps the conflict with a friendly message when the choice could not be saved", async () => {
    const dependencies = create_dependencies();

    const feedback = await apply_conflict_resolution_outcome(dependencies, {
      conflict: CONFLICT,
      action: "keep_local",
      merged_data: {},
      outcome: { kind: "failed", error: "Network request failed" },
    });

    expect(feedback).toEqual({
      status: ConflictResolutionFeedbackStatus.NEEDS_ATTENTION,
      message: expect.not.stringContaining("Network request failed"),
    });
    expect(dependencies.mark_resolved).not.toHaveBeenCalled();
    expect(dependencies.remove_conflict).not.toHaveBeenCalled();
  });

  it("keeps the conflict when the newest server copy cannot be loaded", async () => {
    const dependencies = create_dependencies({
      load_server_copy: vi.fn(async () => ({
        success: false as const,
        error: "offline",
      })),
    });

    const feedback = await apply_conflict_resolution_outcome(dependencies, {
      conflict: CONFLICT,
      action: "keep_local",
      merged_data: {},
      outcome: { kind: "remote_changed_again", server_version: 7 },
    });

    expect(feedback.status).toBe(
      ConflictResolutionFeedbackStatus.NEEDS_ATTENTION,
    );
    expect(dependencies.refresh_remote_copy).not.toHaveBeenCalled();
  });
});

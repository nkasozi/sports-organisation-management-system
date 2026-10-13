import { get } from "svelte/store";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { create_unknown_conflict_field_value } from "$lib/infrastructure/sync/conflictTypes";
import type { ConflictFromServer } from "$lib/infrastructure/sync/syncTypes";

import { conflict_store } from "./conflictStore";

const conflict_store_mocks = vi.hoisted(() => ({
  log_conflict_detected: vi.fn(),
  log_conflict_resolution: vi.fn(),
}));

vi.mock("$lib/infrastructure/sync/conflictAuditService", () => ({
  log_conflict_detected: conflict_store_mocks.log_conflict_detected,
  log_conflict_resolution: conflict_store_mocks.log_conflict_resolution,
}));

const FIXED_NOW = new Date("2025-03-01T08:00:00.000Z");

function build_server_conflict(
  local_id: string,
  local_data: Record<string, unknown>,
): ConflictFromServer {
  return {
    local_id,
    local_data,
    local_version: 1,
    remote_data: { name: "Remote" },
    remote_version: 2,
    remote_updated_at: "2025-02-01T00:00:00.000Z",
    remote_updated_by: create_unknown_conflict_field_value(),
  } as ConflictFromServer;
}

describe("conflict_store", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_NOW);
    conflict_store_mocks.log_conflict_detected.mockReset();
    conflict_store_mocks.log_conflict_resolution.mockReset();
    conflict_store_mocks.log_conflict_detected.mockResolvedValue(true);
    conflict_store_mocks.log_conflict_resolution.mockResolvedValue(true);
    conflict_store.reset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("ignores empty conflict lists", () => {
    expect(conflict_store.add_conflicts_from_sync_response("teams", [])).toBe(
      false,
    );
    expect(get(conflict_store).pending_conflicts).toEqual([]);
    expect(get(conflict_store).show_merge_screen).toBe(false);
  });

  it("maps server conflicts into pending records and audits each one", () => {
    const added = conflict_store.add_conflicts_from_sync_response("teams", [
      build_server_conflict("team-1", { name: "Local" }),
      build_server_conflict("team-2", {
        name: "Other",
        updated_at: "2025-01-01T00:00:00.000Z",
      }),
    ]);

    const state = get(conflict_store);
    expect(added).toBe(true);
    expect(state.show_merge_screen).toBe(true);
    expect(state.pending_conflicts).toHaveLength(2);
    expect(state.pending_conflicts[0]).toMatchObject({
      id: `conflict_teams_team-1_${FIXED_NOW.getTime()}`,
      table_name: "teams",
      local_id: "team-1",
      entity_display_name: "Local",
      local_updated_at: FIXED_NOW.toISOString(),
      remote_updated_at: "2025-02-01T00:00:00.000Z",
      remote_updated_by_name: { status: "unknown" },
      detected_at: FIXED_NOW.toISOString(),
    });
    expect(state.pending_conflicts[1].local_updated_at).toBe(
      "2025-01-01T00:00:00.000Z",
    );
    expect(conflict_store_mocks.log_conflict_detected).toHaveBeenCalledTimes(2);
  });

  it("resolves conflicts by id and records the resolution", () => {
    conflict_store.add_conflicts_from_sync_response("teams", [
      build_server_conflict("team-1", { name: "Local" }),
    ]);
    const conflict_id = get(conflict_store).pending_conflicts[0].id;

    const result = conflict_store.resolve_conflict(conflict_id, "keep_remote");

    expect(result).toEqual({
      success: true,
      data: {
        conflict_id,
        table_name: "teams",
        local_id: "team-1",
        action: "keep_remote",
        resolved_at: FIXED_NOW.toISOString(),
        resolved_by: { status: "unknown" },
        merged_data: undefined,
      },
    });
    expect(get(conflict_store).pending_conflicts).toEqual([]);
    expect(get(conflict_store).resolved_conflicts).toHaveLength(1);
    expect(conflict_store_mocks.log_conflict_resolution).toHaveBeenCalledWith(
      expect.objectContaining({ id: conflict_id }),
      "keep_remote",
      { name: "Remote" },
    );
  });

  it("fails to resolve unknown or absent conflicts", () => {
    expect(conflict_store.resolve_conflict("missing", "keep_local")).toEqual({
      success: false,
      error: "Conflict not found: missing",
    });
    expect(conflict_store.resolve_current_conflict("keep_local")).toEqual({
      success: false,
      error: "No current conflict to resolve",
    });
  });

  it("resolves the current conflict and exposes current conflict state", () => {
    conflict_store.add_conflicts_from_sync_response("teams", [
      build_server_conflict("team-1", { name: "Local" }),
    ]);
    expect(conflict_store.get_current_conflict().status).toBe("present");

    const result = conflict_store.resolve_current_conflict("merge", {
      name: "Merged",
    });

    expect(result.success).toBe(true);
    expect(conflict_store.get_current_conflict()).toEqual({ status: "absent" });
  });

  it("closes the merge screen when no conflicts remain", () => {
    conflict_store.add_conflicts_from_sync_response("teams", [
      build_server_conflict("team-1", { name: "Local" }),
    ]);
    expect(conflict_store.move_to_next_conflict()).toBe(true);

    conflict_store.clear_all_conflicts();
    conflict_store.add_conflicts_from_sync_response("teams", [
      build_server_conflict("team-2", { name: "Local" }),
    ]);
    expect(conflict_store.resolve_current_conflict("keep_local").success).toBe(
      true,
    );

    expect(conflict_store.move_to_next_conflict()).toBe(false);
    expect(get(conflict_store).show_merge_screen).toBe(false);
    expect(get(conflict_store).current_conflict_index).toBe(0);
  });

  it("dismisses the merge screen and delegates resolved data lookup", () => {
    conflict_store.add_conflicts_from_sync_response("teams", [
      build_server_conflict("team-1", { name: "Local" }),
    ]);
    conflict_store.dismiss_merge_screen();
    const conflict = get(conflict_store).pending_conflicts[0];

    expect(get(conflict_store).show_merge_screen).toBe(false);
    expect(
      conflict_store.get_resolved_data_for_action(conflict, "keep_remote"),
    ).toEqual({ name: "Remote" });
  });
});

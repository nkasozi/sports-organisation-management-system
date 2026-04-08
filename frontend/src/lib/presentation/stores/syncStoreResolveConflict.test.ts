import { afterEach, describe, expect, it, vi } from "vitest";

const sync_conflict_resolution_mocks = vi.hoisted(() => ({
  resolve_conflict: vi.fn(),
}));

vi.mock("$lib/infrastructure/sync/convexSyncService", () => ({
  resolve_conflict: sync_conflict_resolution_mocks.resolve_conflict,
}));

import { execute_conflict_resolution } from "./syncStoreResolveConflict";

describe("syncStoreResolveConflict", () => {
  afterEach(() => {
    vi.useRealTimers();
    sync_conflict_resolution_mocks.resolve_conflict.mockReset();
  });

  it("fails fast when the Convex client is not configured", async () => {
    expect(
      await execute_conflict_resolution(
        null,
        {
          id: "conflict-1",
          table_name: "teams",
          local_id: "team-1",
          entity_display_name: "Team A",
          local_data: { name: "Local Team" },
          remote_data: { name: "Remote Team" },
          local_updated_at: "2024-01-01T00:00:00.000Z",
          remote_updated_at: "2024-01-02T00:00:00.000Z",
          remote_updated_by: null,
          remote_updated_by_name: null,
          field_differences: [],
          detected_at: "2024-01-03T00:00:00.000Z",
        },
        "keep_local",
      ),
    ).toEqual({ success: false, error: "Convex client not configured" });
    expect(
      sync_conflict_resolution_mocks.resolve_conflict,
    ).not.toHaveBeenCalled();
  });

  it("sends local data with a fresh timestamp when keeping the local version", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-05-01T10:00:00.000Z"));
    sync_conflict_resolution_mocks.resolve_conflict.mockResolvedValue({
      success: true,
      error: null,
    });
    const convex_client = {
      mutation: vi.fn(),
      query: vi.fn(),
    };

    await execute_conflict_resolution(
      convex_client,
      {
        id: "conflict-1",
        table_name: "teams",
        local_id: "team-1",
        entity_display_name: "Team A",
        local_data: { name: "Local Team" },
        remote_data: { name: "Remote Team" },
        local_updated_at: "2024-01-01T00:00:00.000Z",
        remote_updated_at: "2024-01-02T00:00:00.000Z",
        remote_updated_by: null,
        remote_updated_by_name: null,
        field_differences: [],
        detected_at: "2024-01-03T00:00:00.000Z",
      },
      "keep_local",
    );

    expect(
      sync_conflict_resolution_mocks.resolve_conflict,
    ).toHaveBeenCalledWith(convex_client, {
      table_name: "teams",
      local_id: "team-1",
      resolved_data: {
        name: "Local Team",
        updated_at: "2024-05-01T10:00:00.000Z",
      },
      resolution_action: "keep_local",
    });
  });

  it("uses remote data or merged data depending on the chosen action", async () => {
    sync_conflict_resolution_mocks.resolve_conflict.mockResolvedValue({
      success: true,
      error: null,
    });
    const convex_client = {
      mutation: vi.fn(),
      query: vi.fn(),
    };
    const conflict = {
      id: "conflict-2",
      table_name: "teams",
      local_id: "team-2",
      entity_display_name: "Team B",
      local_data: { name: "Local Team" },
      remote_data: { name: "Remote Team" },
      local_updated_at: "2024-01-01T00:00:00.000Z",
      remote_updated_at: "2024-01-02T00:00:00.000Z",
      remote_updated_by: null,
      remote_updated_by_name: null,
      field_differences: [],
      detected_at: "2024-01-03T00:00:00.000Z",
    };

    await execute_conflict_resolution(convex_client, conflict, "keep_remote");
    expect(
      sync_conflict_resolution_mocks.resolve_conflict,
    ).toHaveBeenNthCalledWith(1, convex_client, {
      table_name: "teams",
      local_id: "team-2",
      resolved_data: { name: "Remote Team" },
      resolution_action: "keep_remote",
    });

    await execute_conflict_resolution(convex_client, conflict, "merge", {
      name: "Merged Team",
      captain: "A. Example",
    });
    expect(
      sync_conflict_resolution_mocks.resolve_conflict,
    ).toHaveBeenNthCalledWith(2, convex_client, {
      table_name: "teams",
      local_id: "team-2",
      resolved_data: {
        name: "Merged Team",
        captain: "A. Example",
      },
      resolution_action: "merge",
    });
  });
});

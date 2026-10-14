import { afterEach, describe, expect, it, vi } from "vitest";

import type { EntityId, Name } from "$lib/core/types/DomainScalars";
import { create_unknown_conflict_field_value } from "$lib/infrastructure/sync/conflictTypes";

import { execute_conflict_resolution } from "./syncStoreResolveConflict";

const sync_conflict_resolution_mocks = vi.hoisted(() => ({
  resolve_conflict_with_outcome: vi.fn(),
}));

vi.mock("$lib/infrastructure/sync/convexSyncService", () => ({
  resolve_conflict_with_outcome:
    sync_conflict_resolution_mocks.resolve_conflict_with_outcome,
}));

describe("syncStoreResolveConflict", () => {
  afterEach(() => {
    vi.useRealTimers();
    sync_conflict_resolution_mocks.resolve_conflict_with_outcome.mockReset();
  });

  it("fails fast when the Convex client is not configured", async () => {
    expect(
      await execute_conflict_resolution(
        { success: false, error: "Convex client not configured" },
        {
          id: "conflict-1",
          table_name: "teams",
          local_id: "team-1",
          entity_display_name: "Team A",
          local_data: { name: "Local Team" },
          remote_data: { name: "Remote Team" },
          remote_version: 2,
          local_updated_at: "2024-01-01T00:00:00.000Z",
          remote_updated_at: "2024-01-02T00:00:00.000Z",
          remote_updated_by: create_unknown_conflict_field_value<EntityId>(),
          remote_updated_by_name: create_unknown_conflict_field_value<Name>(),
          field_differences: [],
          detected_at: "2024-01-03T00:00:00.000Z",
        },
        "keep_local",
      ),
    ).toEqual({ kind: "failed", error: "Convex client not configured" });
    expect(
      sync_conflict_resolution_mocks.resolve_conflict_with_outcome,
    ).not.toHaveBeenCalled();
  });

  it("sends local data with a fresh timestamp when keeping the local version", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-05-01T10:00:00.000Z"));
    sync_conflict_resolution_mocks.resolve_conflict_with_outcome.mockResolvedValue(
      {
        kind: "resolved",
        server_version: 3,
      },
    );
    const convex_client = {
      mutation: vi.fn(),
      query: vi.fn(),
    };

    const resolution = await execute_conflict_resolution(
      { success: true, data: convex_client },
      {
        id: "conflict-1",
        table_name: "teams",
        local_id: "team-1",
        entity_display_name: "Team A",
        local_data: { name: "Local Team" },
        remote_data: { name: "Remote Team" },
        remote_version: 2,
        local_updated_at: "2024-01-01T00:00:00.000Z",
        remote_updated_at: "2024-01-02T00:00:00.000Z",
        remote_updated_by: create_unknown_conflict_field_value<EntityId>(),
        remote_updated_by_name: create_unknown_conflict_field_value<Name>(),
        field_differences: [],
        detected_at: "2024-01-03T00:00:00.000Z",
      },
      "keep_local",
    );
    expect(resolution.kind).toBe("resolved");

    expect(
      sync_conflict_resolution_mocks.resolve_conflict_with_outcome,
    ).toHaveBeenCalledWith(convex_client, {
      table_name: "teams",
      local_id: "team-1",
      resolved_data: {
        name: "Local Team",
        updated_at: "2024-05-01T10:00:00.000Z",
      },
      resolution_action: "keep_local",
      base_version: 2,
    });
  });

  it("uses remote data or merged data depending on the chosen action", async () => {
    sync_conflict_resolution_mocks.resolve_conflict_with_outcome.mockResolvedValue(
      {
        kind: "resolved",
        server_version: 3,
      },
    );
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
      remote_version: 2,
      local_updated_at: "2024-01-01T00:00:00.000Z",
      remote_updated_at: "2024-01-02T00:00:00.000Z",
      remote_updated_by: create_unknown_conflict_field_value<EntityId>(),
      remote_updated_by_name: create_unknown_conflict_field_value<Name>(),
      field_differences: [],
      detected_at: "2024-01-03T00:00:00.000Z",
    };

    const resolution = await execute_conflict_resolution(
      { success: true, data: convex_client },
      conflict,
      "keep_remote",
    );
    expect(resolution.kind).toBe("resolved");
    expect(
      sync_conflict_resolution_mocks.resolve_conflict_with_outcome,
    ).toHaveBeenNthCalledWith(1, convex_client, {
      table_name: "teams",
      local_id: "team-2",
      resolved_data: { name: "Remote Team" },
      resolution_action: "keep_remote",
      base_version: 2,
    });

    const merge_resolution = await execute_conflict_resolution(
      { success: true, data: convex_client },
      conflict,
      "merge",
      {
        name: "Merged Team",
        captain: "A. Example",
      },
    );
    expect(merge_resolution.kind).toBe("resolved");
    expect(
      sync_conflict_resolution_mocks.resolve_conflict_with_outcome,
    ).toHaveBeenNthCalledWith(2, convex_client, {
      table_name: "teams",
      local_id: "team-2",
      resolved_data: {
        name: "Merged Team",
        captain: "A. Example",
      },
      resolution_action: "merge",
      base_version: 2,
    });
  });
});

import { describe, expect, it, vi } from "vitest";

import { create_known_conflict_field_value } from "./conflictTypes";
import { push_table_to_convex } from "./syncPushService";
import type { ConvexClient, TableName } from "./syncTypes";

function create_mock_convex_client(mutation_result: unknown): ConvexClient {
  return {
    query: vi.fn(),
    mutation: vi.fn().mockResolvedValue(mutation_result),
  };
}

function create_record(command: {
  id: string;
  updated_at: string;
  created_at?: string;
}): {
  id: string;
  updated_at: string;
  created_at: string;
} {
  return {
    id: command.id,
    updated_at: command.updated_at,
    created_at: command.created_at ?? "2024-01-01T00:00:00.000Z",
  };
}

describe("syncPushService", () => {
  it("returns success with zero pushed records when nothing is newer than the server", async () => {
    const result = await push_table_to_convex(
      create_mock_convex_client({
        success: true,
        results: [],
        has_conflicts: false,
        conflicts: [],
      }),
      "players" as TableName,
      [
        create_record({
          id: "player-1",
          updated_at: "2024-01-01T00:00:00.000Z",
        }),
      ],
      "2024-02-01T00:00:00.000Z",
    );

    expect(result).toEqual({
      success: true,
      data: { records_pushed: 0, conflicts: [] },
    });
  });

  it("returns failure when the server rejects the push batch", async () => {
    const result = await push_table_to_convex(
      create_mock_convex_client({
        success: false,
        error: "Access denied",
        message: "unauthorized",
        results: [],
        has_conflicts: false,
        conflicts: [],
      }),
      "players" as TableName,
      [
        create_record({
          id: "player-1",
          updated_at: "2024-03-01T00:00:00.000Z",
        }),
      ],
      "2024-02-01T00:00:00.000Z",
    );

    expect(result).toEqual({
      success: false,
      error: "Access denied: unauthorized",
    });
  });

  it("returns pushed counts and conflicts when the batch succeeds", async () => {
    const result = await push_table_to_convex(
      create_mock_convex_client({
        success: true,
        results: [
          { local_id: "player-1", success: true, action: "updated" },
          { local_id: "player-2", success: true, action: "conflict_detected" },
        ],
        has_conflicts: true,
        conflicts: [
          {
            local_id: "player-2",
            local_data: {},
            local_version: 1,
            remote_data: {},
            remote_version: 2,
            remote_updated_at: "2024-03-01T00:00:00.000Z",
            remote_updated_by: "user-1",
          },
        ],
      }),
      "players" as TableName,
      [
        create_record({
          id: "player-1",
          updated_at: "2024-03-01T00:00:00.000Z",
        }),
        create_record({
          id: "player-2",
          updated_at: "2024-03-02T00:00:00.000Z",
        }),
      ],
      "2024-02-01T00:00:00.000Z",
    );

    expect(result).toEqual({
      success: true,
      data: {
        records_pushed: 1,
        conflicts: [
          {
            local_id: "player-2",
            local_data: {},
            local_version: 1,
            remote_data: {},
            remote_version: 2,
            remote_updated_at: "2024-03-01T00:00:00.000Z",
            remote_updated_by: create_known_conflict_field_value("user-1"),
          },
        ],
      },
    });
  });
});

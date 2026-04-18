import { beforeEach, describe, expect, it, vi } from "vitest";

import { pull_table_from_convex } from "./syncPullService";
import type { ConvexClient, ConvexRecord, TableName } from "./syncTypes";

const mock_sync_state = vi.hoisted(() => ({
  set_pulling_from_remote: vi.fn(),
}));

vi.mock("./syncState", () => ({
  set_pulling_from_remote: mock_sync_state.set_pulling_from_remote,
}));

type MockTableRecord = { id: string; updated_at?: string; created_at?: string };

function create_mock_table(existing_records: MockTableRecord[] = []): {
  get: ReturnType<typeof vi.fn>;
  put: ReturnType<typeof vi.fn>;
} {
  return {
    get: vi.fn(async (id: string) =>
      existing_records.find((record) => record.id === id),
    ),
    put: vi.fn(async () => {}),
  };
}

function create_mock_convex_client(query_result: unknown): ConvexClient {
  return {
    query: vi.fn().mockResolvedValue(query_result),
    mutation: vi.fn(),
  };
}

function create_remote_record(overrides: Partial<ConvexRecord>): ConvexRecord {
  return {
    _id: "convex-id",
    local_id: "team-1" as ConvexRecord["local_id"],
    synced_at: "2024-02-01T00:00:00.000Z" as ConvexRecord["synced_at"],
    version: 1,
    ...overrides,
  };
}

describe("syncPullService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns success with zero records when Convex has no changes", async () => {
    const result = await pull_table_from_convex(
      create_mock_convex_client([]),
      create_mock_table() as never,
      "teams" as TableName,
      "2024-01-01T00:00:00.000Z",
    );

    expect(result).toEqual({ success: true, data: { records_pulled: 0 } });
  });

  it("returns failure when Convex reports an error", async () => {
    const result = await pull_table_from_convex(
      create_mock_convex_client({
        success: false,
        error: "Access denied",
        data: [],
      }),
      create_mock_table() as never,
      "teams" as TableName,
      "2024-01-01T00:00:00.000Z",
    );

    expect(result).toEqual({ success: false, error: "Access denied" });
  });

  it("writes newer remote records into the local table", async () => {
    const mock_table = create_mock_table([
      {
        id: "team-1",
        updated_at: "2024-01-01T00:00:00.000Z",
      },
    ]);

    const result = await pull_table_from_convex(
      create_mock_convex_client([
        create_remote_record({
          local_id: "team-1" as ConvexRecord["local_id"],
          updated_at: "2024-03-01T00:00:00.000Z",
          name: "Updated Team",
        }),
      ]),
      mock_table as never,
      "teams" as TableName,
      "2024-01-01T00:00:00.000Z",
    );

    expect(result).toEqual({ success: true, data: { records_pulled: 1 } });
    expect(mock_table.put).toHaveBeenCalledWith({
      id: "team-1",
      updated_at: "2024-03-01T00:00:00.000Z",
      name: "Updated Team",
    });
  });
});

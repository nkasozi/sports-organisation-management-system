import { beforeEach, describe, expect, it, vi } from "vitest";

import { pull_user_scoped_record_from_convex } from "./syncSystemUserOps";
import type { ConvexClient } from "./syncTypes";

const mock_sync_data_access = vi.hoisted(() => ({
  get_database: vi.fn(),
  get_table_from_database: vi.fn(),
}));

vi.mock("./syncDataAccess", () => ({
  get_database: mock_sync_data_access.get_database,
  get_table_from_database: mock_sync_data_access.get_table_from_database,
}));

describe("syncSystemUserOps", () => {
  const mock_table_put = vi.fn();
  const mock_convex_client = {
    query: vi.fn(),
    mutation: vi.fn(),
  } as unknown as ConvexClient;

  beforeEach(() => {
    vi.clearAllMocks();
    mock_sync_data_access.get_database.mockReturnValue({});
    mock_sync_data_access.get_table_from_database.mockReturnValue({
      put: mock_table_put,
    });
  });

  it("returns failure when the Convex client is unavailable", async () => {
    const result = await pull_user_scoped_record_from_convex(
      "teams",
      "team-1",
      () => ({
        get_convex_client: () => ({
          success: false,
          error: "Convex client not initialized",
        }),
      }),
    );

    expect(result).toEqual({
      success: false,
      error: "Convex client not initialized",
    });
  });

  it("returns success false when the scoped record does not exist", async () => {
    mock_convex_client.query = vi.fn().mockResolvedValue({
      status: "not_found",
    });

    const result = await pull_user_scoped_record_from_convex(
      "teams",
      "team-1",
      () => ({
        get_convex_client: () => ({ success: true, data: mock_convex_client }),
      }),
    );

    expect(result).toEqual({ success: true, data: false });
    expect(mock_table_put).not.toHaveBeenCalled();
  });

  it("returns failure when the lookup reports an access error", async () => {
    mock_convex_client.query = vi.fn().mockResolvedValue({
      status: "failure",
      error: "Access denied",
    });

    const result = await pull_user_scoped_record_from_convex(
      "teams",
      "team-1",
      () => ({
        get_convex_client: () => ({ success: true, data: mock_convex_client }),
      }),
    );

    expect(result).toEqual({
      success: false,
      error: "Failed to pull teams record: Access denied",
    });
    expect(mock_table_put).not.toHaveBeenCalled();
  });

  it("writes the record when the scoped lookup succeeds", async () => {
    mock_convex_client.query = vi.fn().mockResolvedValue({
      status: "found",
      record: {
        _id: "convex-doc-id",
        _creationTime: 123,
        id: "ignored-convex-id",
        local_id: "team-1",
        synced_at: "2024-01-01T00:00:00.000Z",
        version: 4,
        name: "Team A",
        created_at: "2024-01-01T00:00:00.000Z",
      },
    });

    const result = await pull_user_scoped_record_from_convex(
      "teams",
      "team-1",
      () => ({
        get_convex_client: () => ({ success: true, data: mock_convex_client }),
      }),
    );

    expect(result).toEqual({ success: true, data: true });
    expect(mock_table_put).toHaveBeenCalledWith({
      id: "team-1",
      name: "Team A",
      created_at: "2024-01-01T00:00:00.000Z",
    });
  });
});
